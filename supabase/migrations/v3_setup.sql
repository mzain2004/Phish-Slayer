-- Phish-Slayer V3 Migration
-- Run this in Supabase SQL Editor

-- Port patrol data on scans
ALTER TABLE public.scans 
  ADD COLUMN IF NOT EXISTS port_patrol jsonb;

-- AI heuristic results cache on scans
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS ai_heuristic jsonb;

-- SIEM webhook on profiles  
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS siem_webhook_url text;
