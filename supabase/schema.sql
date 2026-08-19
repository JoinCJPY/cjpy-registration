-- ==============================================================================
-- CJpy Cohort 02 Registration Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Create table for registrations
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Student Details
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Cohort & Enrollment Info
    cohort TEXT NOT NULL DEFAULT 'CJpy Cohort 02',
    seat_number INTEGER,
    
    -- Paystack Payment Info
    payment_reference TEXT UNIQUE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GHS',
    payment_status TEXT NOT NULL DEFAULT 'success',
    channel TEXT, -- e.g. 'mobile_money', 'card', 'bank_transfer'
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Full Raw Payload for Auditing & Backup
    paystack_metadata JSONB DEFAULT '{}'::jsonb,
    raw_payload JSONB DEFAULT '{}'::jsonb
);

-- 2. Indexes for fast lookup & reporting
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations (email);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations (phone);
CREATE INDEX IF NOT EXISTS idx_registrations_ref ON public.registrations (payment_reference);
CREATE INDEX IF NOT EXISTS idx_registrations_cohort ON public.registrations (cohort);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow Edge Functions (service_role) full access
CREATE POLICY "Service role full access to registrations" 
ON public.registrations 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Allow authenticated admins to view all registrations
CREATE POLICY "Authenticated admins can view registrations" 
ON public.registrations 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. View to easily check current cohort metrics & seats filled
CREATE OR REPLACE VIEW public.cohort_stats AS
SELECT 
    cohort,
    COUNT(*) AS total_registered,
    SUM(amount_paid) AS total_revenue_ghs,
    MAX(created_at) AS last_registration_at
FROM public.registrations
WHERE payment_status = 'success'
GROUP BY cohort;
