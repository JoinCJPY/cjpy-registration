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

## 3. Set Environment Secrets in Supabase

The function requires your Paystack Live Secret Key (`sk_live_...`).

1. In Supabase Dashboard, go to **Project Settings** -> **Edge Functions** (or **Vault / Secrets**).
2. Add a new secret:
   - **Name**: `PAYSTACK_SECRET_KEY`
   - **Value**: `sk_live_your_actual_paystack_secret_key`
3. Save.

---

## 4. Add the Webhook URL in Paystack

1. Go to your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers).
2. Go to **Settings** ➔ **API Keys & Webhooks**.
3. Under **Live Webhook URL**, paste your Supabase Edge Function URL:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook
   ```
4. Click **Save Changes**.

---

## 5. What Happens Automatically on Payment?

When a student pays GH₵ 300 on `joincjpy.com`:
1. Paystack securely fires a `charge.success` webhook to your Supabase function.
2. The Edge function checks the HMAC-SHA512 cryptographic signature to confirm it genuinely came from Paystack.
3. The student's **Full Name**, **Email**, **WhatsApp/Phone**, **Amount Paid**, **Payment Reference**, and **Payment Timestamp** are saved directly to your Supabase `registrations` table.
4. You can export the list to CSV anytime from the Supabase Table Editor or view real-time metrics with the `cohort_stats` view!
