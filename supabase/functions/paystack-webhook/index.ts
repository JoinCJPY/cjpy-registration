// Supabase Edge Function: paystack-webhook
// Securely verifies Paystack HMAC SHA-512 signatures, stores registration records in PostgreSQL,
// and sends an automated branded Welcome & Onboarding Email via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "CJpy Admissions <admissions@joincjpy.com>";
const WHATSAPP_LINK = "https://chat.whatsapp.com/HUHzlyLvimREGt1S0GkTnm";
const INTAKE_FORM_LINK = "https://forms.gle/UG8qKUNKtBBvu9j78";
const SPRINT_WHATSAPP_LINK = Deno.env.get("SPRINT_WHATSAPP_LINK") || "https://chat.whatsapp.com/IGDn2yKUFVAGwlcd0fJySw";
const SPRINT_INTAKE_FORM_LINK = Deno.env.get("SPRINT_INTAKE_FORM_LINK") || INTAKE_FORM_LINK;

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

// Generate branded HTML welcome & status update email (IPhR-inspired authentic dark card)
function generateWelcomeEmailHtml(name: string, reference: string, amount: number, cohortName: string = "CJpy Cohort 02"): string {
  const isSprint = cohortName.toLowerCase().includes("sprint") || amount === 150;
  const programTitle = isSprint ? "CJpy Sprint (21-Day Python Fundamentals Track)" : "CJpy Cohort 02 (Python Bootcamp)";
  const pageTitle = isSprint ? "CJpy Sprint - Registration Confirmed" : "CJpy Cohort 02 - Enrollment Status Update";
  const headerStatus = isSprint ? "CJpy Sprint Status Update" : "2026 Cohort 02 Status Update";
  const programSubline = isSprint ? "Python Fundamentals Track" : "Python Bootcamp";
  const cohortNotice = isSprint
    ? `This is an official status update regarding your registration for <strong>CJpy Sprint</strong> (21-Day Python Fundamentals Track).`
    : `This is an official status update regarding your registration for the <strong>CJpy 2026 Cohort 02</strong> (30-Day Python Bootcamp).`;
  const durationLabel = isSprint ? "Schedule & Format" : "Cohort Start Date";
  const durationVal = isSprint ? "21 Days &middot; Starts Wed, Sept 16, 2026 (Live on Zoom)" : "Thursday, Sept 10, 2026";
  const curriculumRow = isSprint ? `
                <tr>
                  <td style="color:#8b93a5;font-size:13px;border-bottom:1px solid #2a2e3b;">Schedule</td>
                  <td style="color:#ffffff;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #2a2e3b;">Mondays, Wednesdays &amp; Fridays (Recorded)</td>
                </tr>
                <tr>
                  <td style="color:#8b93a5;font-size:13px;border-bottom:1px solid #2a2e3b;">Curriculum</td>
                  <td style="color:#ffffff;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #2a2e3b;">Python Fundamentals (Syntax, Structures, Algorithms)</td>
                </tr>` : ``;
  const whatsappUrl = isSprint ? SPRINT_WHATSAPP_LINK : WHATSAPP_LINK;
  const whatsappChannelName = isSprint ? "Join CJpy Sprint WhatsApp Group" : "Join Cohort 02 WhatsApp Community";
  const whatsappBtnText = isSprint ? "Join Sprint WhatsApp Group &rarr;" : "Join Cohort 02 WhatsApp Group &rarr;";
  const whatsappDesc = isSprint
    ? "Once you have submitted your form, join the private CJpy Sprint WhatsApp channel. All live Zoom session links, recorded replays, coding exercises, and mentor support will be coordinated exclusively in this group."
    : "Once you have submitted your form, join the private Cohort 02 WhatsApp channel. All live Zoom session links, recorded replays, mentorship hours, and code reviews will be coordinated exclusively in this group.";
  const intakeUrl = isSprint ? SPRINT_INTAKE_FORM_LINK : INTAKE_FORM_LINK;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    .cjpy-brand {
      font-family: 'Bricolage Grotesque', 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 800;
      letter-spacing: -0.035em;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      text-decoration: none;
    }
    .cjpy-brand span {
      display: inline-block;
      transition: transform .22s cubic-bezier(.34, 1.56, .64, 1), color .18s ease;
      will-change: transform;
    }
    .cjpy-brand .b-c { color: #d81b7a !important; }
    .cjpy-brand .b-j { color: #2b7fc4 !important; }
    .cjpy-brand .b-p { color: #7b2ff2 !important; }
    .cjpy-brand .b-y { color: #f2a413 !important; }

    /* Interactive hover bounce matching site */
    .cjpy-brand:hover .b-c { transform: translateY(-3px) rotate(-6deg); }
    .cjpy-brand:hover .b-j { transform: translateY(-3px) rotate(4deg); transition-delay: .04s; }
    .cjpy-brand:hover .b-p { transform: translateY(-3px) rotate(-4deg); transition-delay: .08s; }
    .cjpy-brand:hover .b-y { transform: translateY(-3px) rotate(6deg); transition-delay: .12s; }

    .cjpy-badge {
      background: #20232c;
      border: 1px solid #2e3342;
      padding: 4px 10px;
      border-radius: 8px;
      transition: background 0.2s, border-color 0.2s;
    }
    .cjpy-badge:hover {
      background: #262a36;
      border-color: #3b4255;
    }

    /* Mobile phone optimization */
    @media only screen and (max-width: 600px) {
      .email-outer-td { padding: 20px 10px !important; }
      .email-card-td { padding: 28px 18px 24px !important; }
      .email-h1 { font-size: 18px !important; line-height: 1.25 !important; }
      .email-badge-td { padding-right: 8px !important; }
      .email-badge-link { font-size: 16px !important; padding: 3px 8px !important; }
      .email-spec-table td { padding: 9px 6px !important; font-size: 12.5px !important; }
      .email-action-box { padding: 18px 15px !important; }
      .email-btn { width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#b4bce9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Outer Lavender / Periwinkle Canvas -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#b4bce9;">
    <tr>
      <td align="center" class="email-outer-td" style="padding:40px 16px;">
        <!-- Top Institutional Brand Header -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px auto;">
          <tr>
            <td style="vertical-align:middle;padding-right:12px;">
              <img src="https://raw.githubusercontent.com/JoinCJPY/cjpy-registration/main/logo-clean.png" alt="CJpy" width="44" height="44" style="display:block;border-radius:10px;border:1px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
            </td>
            <td style="vertical-align:middle;text-align:left;">
              <div class="cjpy-brand" style="font-size:20px;line-height:1.1;margin-bottom:2px;">
                <span class="b-c" style="color:#d81b7a;">C</span><span class="b-j" style="color:#2b7fc4;">J</span><span class="b-p" style="color:#7b2ff2;">p</span><span class="b-y" style="color:#f2a413;">y</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.88);letter-spacing:1.6px;text-transform:uppercase;">${programSubline}</div>
            </td>
          </tr>
        </table>

        <!-- Main Slate/Charcoal Email Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#16171d;border-radius:24px;overflow:hidden;box-shadow:0 20px 48px rgba(18,21,38,0.25);border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td class="email-card-td" style="padding:40px 36px 36px;">

              <!-- Status Title with Interactive Multi-Colored CJpy Badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td class="email-badge-td" style="vertical-align:middle;padding-right:12px;">
                    <a href="https://joincjpy.com" target="_blank" class="cjpy-brand cjpy-badge email-badge-link" title="CJpy" style="text-decoration:none;display:inline-flex;align-items:center;vertical-align:middle;font-size:19px;line-height:1;">
                      <span class="b-c" style="color:#d81b7a;display:inline-block;">C</span><span class="b-j" style="color:#2b7fc4;display:inline-block;">J</span><span class="b-p" style="color:#7b2ff2;display:inline-block;">p</span><span class="b-y" style="color:#f2a413;display:inline-block;">y</span>
                    </a>
                  </td>
                  <td style="vertical-align:middle;">
                    <h1 class="email-h1" style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.4px;line-height:1.25;">${headerStatus}</h1>
                  </td>
                </tr>
              </table>

              <!-- Salutation -->
              <p style="margin:0 0 16px;color:#d5d9e2;font-size:15px;font-weight:500;">Dear ${name || "Participant"},</p>

              <!-- Body Paragraphs -->
              <p style="margin:0 0 16px;color:#cbd2df;font-size:14.5px;line-height:1.65;">
                ${cohortNotice}
              </p>
              <p style="margin:0 0 24px;color:#cbd2df;font-size:14.5px;line-height:1.65;">
                Your tuition payment of <strong>GH₵ ${amount}</strong> has been verified, and your seat is currently <strong style="color:#ffffff;">live, confirmed, and functioning normally</strong>.
              </p>

              <!-- Enrollment Specification Table -->
              <table width="100%" cellpadding="11" cellspacing="0" class="email-spec-table" style="background-color:#1e2028;border:1px solid #2a2e3b;border-radius:12px;margin:0 0 28px;">
                <tr>
                  <td style="color:#8b93a5;font-size:13px;border-bottom:1px solid #2a2e3b;">Participant</td>
                  <td style="color:#ffffff;font-size:13.5px;font-weight:600;text-align:right;border-bottom:1px solid #2a2e3b;">${name || "Confirmed Student"}</td>
                </tr>
                <tr>
                  <td style="color:#8b93a5;font-size:13px;border-bottom:1px solid #2a2e3b;">Program</td>
                  <td style="color:#ffffff;font-size:13.5px;font-weight:600;text-align:right;border-bottom:1px solid #2a2e3b;">${programTitle}</td>
                </tr>
                <tr>
                  <td style="color:#8b93a5;font-size:13px;border-bottom:1px solid #2a2e3b;">${durationLabel}</td>
                  <td style="color:#deb05e;font-size:13.5px;font-weight:600;text-align:right;border-bottom:1px solid #2a2e3b;">${durationVal}</td>
                </tr>${curriculumRow}
                <tr>
                  <td style="color:#8b93a5;font-size:13px;border-bottom:1px solid #2a2e3b;">Payment Ref</td>
                  <td style="color:#8b93a5;font-family:monospace;font-size:12.5px;text-align:right;border-bottom:1px solid #2a2e3b;">${reference}</td>
                </tr>
                <tr>
                  <td style="color:#8b93a5;font-size:13px;">Enrollment Status</td>
                  <td style="color:#4ade80;font-size:13px;font-weight:600;text-align:right;">● Verified & Recorded</td>
                </tr>
              </table>

              <!-- ACTION 1: INTAKE FORM -->
              <div class="email-action-box" style="background-color:#1e2028;border:1px solid #2e3444;border-radius:14px;padding:22px;margin-bottom:18px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                  <tr>
                    <td>
                      <span style="display:inline-block;background-color:#2a3040;color:#cbd2df;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:8px;">Step 1 of 2 &middot; Required</span>
                      <h3 style="margin:0;color:#ffffff;font-size:16px;font-weight:600;letter-spacing:-0.2px;">Complete Student Onboarding Form</h3>
                    </td>
                  </tr>
                </table>
                <p style="color:#a4adbe;font-size:13.5px;line-height:1.55;margin:0 0 16px;">
                  Please complete this official intake form before class starts. It records your current programming experience, laptop specifications, and learning goals so our teaching assistants can assign your breakout rooms and mentor pairings.
                </p>
                <a href="${intakeUrl}" target="_blank" class="email-btn" style="display:inline-block;background-color:#ffffff;color:#14151a;text-decoration:none;font-weight:600;font-size:13.5px;padding:11px 22px;border-radius:8px;letter-spacing:0.2px;">
                  Fill Student Onboarding Form &rarr;
                </a>
              </div>

              <!-- ACTION 2: WHATSAPP COMMUNITY -->
              <div class="email-action-box" style="background-color:#1e2028;border:1px solid #2e3444;border-radius:14px;padding:22px;margin-bottom:26px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                  <tr>
                    <td>
                      <span style="display:inline-block;background-color:#193425;color:#4ade80;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:8px;">Step 2 of 2 &middot; Community</span>
                      <h3 style="margin:0;color:#ffffff;font-size:16px;font-weight:600;letter-spacing:-0.2px;">${whatsappChannelName}</h3>
                    </td>
                  </tr>
                </table>
                <p style="color:#a4adbe;font-size:13.5px;line-height:1.55;margin:0 0 16px;">
                  ${whatsappDesc}
                </p>
                <a href="${whatsappUrl}" target="_blank" class="email-btn" style="display:inline-block;background-color:#25D366;color:#ffffff;text-decoration:none;font-weight:600;font-size:13.5px;padding:11px 22px;border-radius:8px;box-shadow:0 2px 10px rgba(37,211,102,0.2);">
                  ${whatsappBtnText}
                </a>
              </div>

              <!-- Setup Requirements -->
              <div style="margin:24px 0 28px;">
                <h4 style="color:#ffffff;font-size:13.5px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.6px;">Required Setup for First Session:</h4>
                <ul style="margin:0;padding-left:20px;color:#a4adbe;font-size:13.5px;line-height:1.75;">
                  <li>Functional laptop (macOS, Windows 10/11, or Linux).</li>
                  <li>Download & install <a href="https://code.visualstudio.com/" target="_blank" style="color:#deb05e;text-decoration:underline;">Visual Studio Code</a>.</li>
                  <li>Download & install <a href="https://www.python.org/downloads/" target="_blank" style="color:#deb05e;text-decoration:underline;">Python 3.12+</a>.</li>
                </ul>
              </div>

              <!-- Official Support & Sign-off -->
              <div style="border-top:1px solid #282b36;padding-top:22px;margin-top:28px;">
                <p style="color:#8b93a5;font-size:13px;line-height:1.6;margin:0 0 14px;">
                  If you require any assistance with the form or setting up your development tools, reply directly to this email or contact admissions via WhatsApp at <strong style="color:#d5d9e2;">+233 50 932 9059</strong>.
                </p>
                <p style="color:#8b93a5;font-size:13px;line-height:1.5;margin:0;">
                  Warm regards,<br>
                  <strong style="color:#ffffff;">CJpy Admissions & Academic Operations</strong><br>
                  <span style="color:#6d7587;font-size:12px;">Accra &amp; Kumasi, Ghana &middot; admissions@joincjpy.com</span>
                </p>
              </div>

            </td>
          </tr>
        </table>

        <!-- Outer Footer -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0 auto;text-align:center;">
          <tr>
            <td style="color:#ffffff;font-size:12px;opacity:0.85;line-height:1.5;">
              &copy; 2026 CJpy. Official Academic Communications &middot; <a href="https://joincjpy.com" target="_blank" style="color:#ffffff;text-decoration:underline;">joincjpy.com</a>
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
async function sendWelcomeEmail(toEmail: string, name: string, reference: string, amount: number, cohortName: string = "CJpy Cohort 02") {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured. Skipping welcome email.");
    return;
  }

  const isSprint = cohortName.toLowerCase().includes("sprint") || amount === 150;
  const subject = isSprint
    ? `CJpy Sprint Status Update: Registration Confirmed (${name || "Participant"})`
    : `CJpy 2026 Cohort 02 Status Update: Registration Confirmed (${name || "Participant"})`;

  try {
    const html = generateWelcomeEmailHtml(name, reference, amount, cohortName);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`Welcome email sent to ${toEmail} for ${cohortName}. Resend ID: ${data.id}`);
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
        await sendWelcomeEmail(email, fullName, reference, amountPaid, cohort);
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
