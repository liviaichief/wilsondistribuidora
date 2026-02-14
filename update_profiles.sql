-- Add user details to profiles table
alter table public.profiles 
add column if not exists full_name text,
add column if not exists phone text,
add column if not exists birth_date date;

-- Securely allows users to update their own profile including these new columns
create policy "Users can update own profile details"
on profiles for update
using ( auth.uid() = id );
