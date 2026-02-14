-- Adjust Order ID Sequence
-- Run this in Supabase SQL Editor

-- 1. Restart the sequence at 100
alter table public.orders alter column id restart with 100;

-- Note: This will make the NEXT order be 100.
-- Existing orders will remain with their current IDs.
