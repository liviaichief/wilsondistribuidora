
-- Re-enable RLS
alter table public.banners enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Public banners are viewable by everyone" on public.banners;
drop policy if exists "Admins can manage banners" on public.banners;

-- Re-create policies
create policy "Public banners are viewable by everyone" 
on public.banners for select 
using ( true );

create policy "Admins can manage banners" 
on public.banners for all 
using ( public.is_admin() );
