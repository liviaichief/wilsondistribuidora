
-- Temporarily disable RLS for banners to verify if it's permission issue
alter table public.banners disable row level security;
-- Ensure duration column exists
alter table public.banners add column if not exists duration integer default 5;
-- Ensure active column exists
alter table public.banners add column if not exists active boolean default true;
