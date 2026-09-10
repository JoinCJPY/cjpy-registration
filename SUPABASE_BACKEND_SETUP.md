
# 🚀 CJpy Supabase Backend Setup Guide

This backend automatically receives Paystack payment events, cryptographically verifies them with HMAC-SHA512, and stores registered students directly into your Supabase PostgreSQL database.

---

## 1. Database Setup (1 Minute)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and go to your project.
2. Click **SQL Editor** in the left sidebar.
3. Click **New Query**, then open and copy all the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Paste into the SQL editor and click **Run**.
5. Your `registrations` table and `cohort_stats` view are now created!

---

## 2. Deploying the Edge Function

### Option A: Using the Supabase Dashboard (No CLI needed)
1. In your Supabase Dashboard, click **Edge Functions** in the left sidebar.
2. Click **Create a new function** and name it `paystack-webhook`.
3. Paste the contents of [`supabase/functions/paystack-webhook/index.ts`](./supabase/functions/paystack-webhook/index.ts).
4. Click **Deploy**.

### Option B: Using Supabase CLI (Terminal)
If you use the Supabase CLI on your computer:
```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
npx supabase functions deploy paystack-webhook --no-verify-jwt
```

---

## 3. Set Environment Secrets in Supabase (CRITICAL FOR EMAILS)

The Edge Function requires your Paystack Live Secret Key and your Resend API Key to send the automated status update emails.

1. In your **Supabase Dashboard**, go to **Project Settings** (gear icon) ➔ **Edge Functions** (or **Vault / Secrets**).
2. Add the following secrets:

| Secret Name | Value | Purpose |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | `sk_live_...` | Verifies payments directly from Paystack |
| `RESEND_API_KEY` | `re_...` | **Required to send emails via Resend** |
| `FROM_EMAIL` | `CJpy Admissions <admissions@joincjpy.com>` | Sender address (must match a verified domain in Resend) |
| `SPRINT_WHATSAPP_LINK` | *(Optional)* `https://chat.whatsapp.com/...` | Custom WhatsApp group link for CJpy Sprint students (defaults to main group) |
| `SPRINT_INTAKE_FORM_LINK` | *(Optional)* `https://forms.gle/...` | Custom onboarding intake form for CJpy Sprint students (defaults to main form) |

> ⚠️ **Important**: If `RESEND_API_KEY` is not set, the Edge Function silently skips sending the email!

---

## 4. Verify Your Domain in Resend (resend.com)

1. Sign in to your [Resend Dashboard](https://resend.com/domains).
2. Click **Add Domain** and enter `joincjpy.com`.
3. Add the DNS records (DKIM, SPF) provided by Resend to your domain DNS provider (Namecheap, Cloudflare, etc.).
4. Once verified, Resend will successfully deliver emails to all student addresses without being rejected or marked as spam.
5. *(Optional testing)*: If your domain is not verified yet, Resend restricts `onboarding@resend.dev` to only sending to the account owner's email address.

---

## 5. Add the Webhook URL in Paystack

1. Go to your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers).
2. Go to **Settings** ➔ **API Keys & Webhooks**.
3. Under **Live Webhook URL**, paste your Supabase Edge Function URL:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook
   ```
4. Click **Save Changes**.

---

## 6. How to Diagnose & Verify Why Emails Aren't Arriving

If a user paid and didn't receive an email, check these two places in 30 seconds:

### A. Check Supabase Edge Function Logs:
1. Open Supabase Dashboard ➔ **Edge Functions** ➔ click **`paystack-webhook`**.
2. Click the **Invocations / Logs** tab.
3. If you see:
   - `"RESEND_API_KEY not configured. Skipping welcome email."` ➔ You need to add the `RESEND_API_KEY` secret in Supabase!
   - `"Resend API error: domain not verified"` ➔ Your domain `joincjpy.com` is not verified in Resend.
   - `"Invalid signature"` ➔ `PAYSTACK_SECRET_KEY` is incorrect or missing.
   - No logs at all ➔ Paystack hasn't sent the webhook yet (check Paystack Webhook URL).

### B. Check Paystack Webhook Logs:
1. Open Paystack Dashboard ➔ **Settings** ➔ **Webhooks**.
2. Scroll to **Recent Webhooks / Webhook Logs**.
3. Check the HTTP response status code for the transaction:
   - `200 OK`: Paystack successfully reached Supabase.
   - `401 Unauthorized`: Paystack secret key mismatch.
   - `Failed / Timeout`: Webhook URL is invalid or unreachable.
