
-- 1. Create Profiles table to store user data publicly (for admin access)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'customer', -- 'admin' or 'customer'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable RLS on profiles
alter table public.profiles enable row level security;

-- 3. Profiles policies
create policy "Public profiles are potentially viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 4. Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Add user_id to orders
alter table public.orders 
add column if not exists user_id uuid references auth.users(id);

-- 6. Update Orders RLS to allow users to see their own orders
create policy "Users can see their own orders"
  on orders for select
  using ( auth.uid() = user_id );

