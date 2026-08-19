// Supabase Edge Function: paystack-webhook
// Securely verifies Paystack HMAC SHA-512 signatures, stores registration records in PostgreSQL,
// and sends an automated branded Welcome & Onboarding Email via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "CJpy Admissions <onboarding@resend.dev>";
const WHATSAPP_LINK = "https://chat.whatsapp.com/HUHzlyLvimREGt1S0GkTnm";

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

// Generate branded HTML welcome email
function generateWelcomeEmailHtml(name: string, reference: string, amount: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CJpy Cohort 02</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141a24;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(13,43,78,0.08);border:1px solid #e3e7ee;" cellpadding="0" cellspacing="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0d2b4e 0%, #163a66 100%);padding:36px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Welcome to CJpy! 🚀</h1>
              <p style="margin:0;color:#fdf1da;font-size:15px;font-weight:500;">Your Seat in Cohort 02 is Confirmed</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h2 style="font-size:19px;margin:0 0 16px;color:#0d2b4e;">Hi ${name},</h2>
              <p style="font-size:15px;color:#2b3442;margin:0 0 20px;">
                Congratulations on taking this decisive step into software engineering! Your payment of <strong>GH₵ ${amount}</strong> has been successfully received and your registration for <strong>CJpy Cohort 02</strong> is locked in.
              </p>

              <!-- Enrollment Summary Box -->
              <table width="100%" cellpadding="12" cellspacing="0" style="background:#f8fafc;border:1px solid #e3e7ee;border-radius:12px;margin:20px 0;">
                <tr>
                  <td style="font-size:14px;color:#657184;border-bottom:1px solid #e3e7ee;"><strong>Cohort:</strong></td>
                  <td style="font-size:14px;color:#0d2b4e;font-weight:600;text-align:right;border-bottom:1px solid #e3e7ee;">CJpy Cohort 02</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#657184;border-bottom:1px solid #e3e7ee;"><strong>Start Date:</strong></td>
                  <td style="font-size:14px;color:#0d2b4e;font-weight:600;text-align:right;border-bottom:1px solid #e3e7ee;">Sept 10, 2026</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#657184;"><strong>Payment Ref:</strong></td>
                  <td style="font-size:14px;color:#657184;font-family:monospace;text-align:right;">${reference}</td>
                </tr>
              </table>

              <!-- Action Callout (WhatsApp) -->
              <div style="background:#fdf1da;border:1px solid #f2a413;border-radius:12px;padding:24px;text-align:center;margin:28px 0;">
                <h3 style="margin:0 0 8px;color:#0d2b4e;font-size:17px;font-weight:700;">Step 1: Join the Cohort WhatsApp Group</h3>
                <p style="font-size:14px;color:#4d586a;margin:0 0 18px;">
                  All live Zoom links, curriculum announcements, mentorship schedules, and peer study rooms are hosted in our private WhatsApp community.
                </p>
                <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;box-shadow:0 4px 12px rgba(37,211,102,0.25);">
                  👉 Join Cohort 02 WhatsApp Group
                </a>
              </div>

              <!-- What to Expect -->
              <h3 style="font-size:16px;color:#0d2b4e;margin:24px 0 10px;">What to Prepare Before Class:</h3>
              <ul style="padding-left:20px;margin:0 0 24px;font-size:14px;color:#4d586a;line-height:1.8;">
                <li>A functional laptop (Windows, Mac, or Linux).</li>
                <li>Download & install <a href="https://code.visualstudio.com/" style="color:#0d2b4e;font-weight:600;">VS Code</a>.</li>
                <li>Download & install <a href="https://www.python.org/downloads/" style="color:#0d2b4e;font-weight:600;">Python 3.12+</a>.</li>
              </ul>

              <p style="font-size:14px;color:#657184;margin:24px 0 0;">
                If you have any questions or need help setting up, reply directly to this email or reach us on WhatsApp at <strong>050 932 9059</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e3e7ee;font-size:12px;color:#8a94a5;">
              <p style="margin:0 0 4px;"><strong>CJpy — Learn today. Build tomorrow. Lead forever.</strong></p>
              <p style="margin:0;">&copy; 2026 CJpy. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send automated welcome email via Resend
async function sendWelcomeEmail(toEmail: string, name: string, reference: string, amount: number) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured. Skipping welcome email.");
    return;
  }

  try {
    const html = generateWelcomeEmailHtml(name, reference, amount);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `Welcome to CJpy Cohort 02, ${name}! 🚀 (Your Seat is Confirmed)`,
        html: html,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`Welcome email sent to ${toEmail}. Resend ID: ${data.id}`);
    } else {
      console.error("Resend API error:", data);
    }
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

Deno.serve(async (req: Request) => {
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

    // 1. Verify HMAC Signature from Paystack (if PAYSTACK_SECRET_KEY is configured)
    if (PAYSTACK_SECRET_KEY) {
      const isValid = await verifyPaystackSignature(rawBody, signature);
      if (!isValid) {
        console.error("Unauthorized webhook: Invalid or missing Paystack signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
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

      // 5. Send automated branded welcome email with WhatsApp group link
      if (email) {
        await sendWelcomeEmail(email, fullName, reference, amountPaid);
      }
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
