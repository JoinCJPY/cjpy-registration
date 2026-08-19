// Supabase Edge Function: paystack-webhook
// Securely verifies Paystack HMAC SHA-512 signatures and stores registration records in PostgreSQL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Convert byte array to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verify Paystack HMAC SHA-512 signature
async function verifyPaystackSignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature || !PAYSTACK_SECRET_KEY) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(PAYSTACK_SECRET_KEY);
  const messageData = encoder.encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const expectedSignature = bufferToHex(signatureBuffer);

  return expectedSignature.toLowerCase() === signature.trim().toLowerCase();
}

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 1. Verify HMAC Signature from Paystack
    const isValid = await verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      console.error("Unauthorized webhook: Invalid or missing Paystack signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);

    // 2. Process only successful charges
    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata || {};
      const customer = data.customer || {};

      // Extract custom fields or fallback to customer standard fields
      const customFields = metadata.custom_fields || [];
      const fullNameField = customFields.find((f: any) => f.variable_name === "full_name")?.value;
      const phoneField = customFields.find((f: any) => f.variable_name === "phone")?.value;
      const cohortField = customFields.find((f: any) => f.variable_name === "cohort")?.value;

      const fullName = metadata.full_name || fullNameField || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Student";
      const email = customer.email || data.email || "";
      const phone = metadata.phone || phoneField || customer.phone || "";
      const cohort = metadata.cohort || cohortField || "CJpy Cohort 02";
      const reference = data.reference;
      const amountPaid = (data.amount || 0) / 100; // Paystack amounts are in pesewas (100 pesewas = 1 GHS)
      const currency = data.currency || "GHS";
      const channel = data.channel || "paystack";
      const paidAt = data.paid_at || new Date().toISOString();
      const seatNumber = metadata.seat ? parseInt(String(metadata.seat), 10) : null;

      // 3. Initialize Supabase Admin Client
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // 4. Upsert registration into PostgreSQL database (idempotent by payment_reference)
      const { data: insertedData, error: dbError } = await supabase
        .from("registrations")
        .upsert(
          {
            full_name: fullName,
            email: email,
            phone: phone,
            cohort: cohort,
            seat_number: seatNumber,
            payment_reference: reference,
            amount_paid: amountPaid,
            currency: currency,
            payment_status: "success",
            channel: channel,
            paid_at: paidAt,
            paystack_metadata: metadata,
            raw_payload: data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "payment_reference" }
        )
        .select();

      if (dbError) {
        console.error("Database insert error:", dbError);
        return new Response(JSON.stringify({ error: "Failed to record registration", details: dbError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`Successfully registered: ${fullName} (${email}) for reference ${reference}`);
    }

    // Always acknowledge Paystack with 200 OK
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
