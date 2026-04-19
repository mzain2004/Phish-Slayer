-- Drop legacy audit_log table if it still exists.
-- Safe to run repeatedly.

DROP TABLE IF EXISTS public.audit_log CASCADE;
