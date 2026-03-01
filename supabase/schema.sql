-- ================================================
-- REWARD MANAGEMENT APP - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ================================================
-- PROFILES (extends auth.users)
-- ================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  total_points integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: All authenticated users can read all profiles (needed for leaderboards and auth checks)
create policy "profiles_select" on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles_update_admin" on public.profiles for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "profiles_insert" on public.profiles for insert
  with check (auth.uid() = id);

-- ================================================
-- REVIEWS
-- ================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  review_link text not null,
  screenshot_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  points_awarded integer not null default 0,
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Employees see their own; admins see all
create policy "reviews_select" on public.reviews for select
  using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "reviews_insert" on public.reviews for insert
  with check (employee_id = auth.uid());

-- Only admins can update (approve/reject)
create policy "reviews_update_admin" on public.reviews for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ================================================
-- REWARDS
-- ================================================
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points_required integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.rewards enable row level security;

-- Everyone can read rewards
create policy "rewards_select" on public.rewards for select using (true);

-- Only admins can insert/update rewards
create policy "rewards_insert_admin" on public.rewards for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "rewards_update_admin" on public.rewards for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ================================================
-- REDEMPTIONS
-- ================================================
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'delivered')),
  created_at timestamptz not null default now()
);

alter table public.redemptions enable row level security;

-- Employees see their own; admins see all
create policy "redemptions_select" on public.redemptions for select
  using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "redemptions_insert" on public.redemptions for insert
  with check (employee_id = auth.uid());

create policy "redemptions_update_admin" on public.redemptions for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ================================================
-- AUTH TRIGGER: Auto-create profile on signup
-- ================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================
-- STORAGE BUCKET for screenshots
-- Run this from Supabase Dashboard > Storage
-- or via Management API
-- ================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('review-screenshots', 'review-screenshots', false);

-- Storage policy: authenticated users can upload
-- create policy "screenshots_upload" on storage.objects for insert
--   with check (bucket_id = 'review-screenshots' and auth.role() = 'authenticated');

-- Admins can read all; employees read their own
-- create policy "screenshots_select" on storage.objects for select
--   using (bucket_id = 'review-screenshots' and auth.role() = 'authenticated');

-- ================================================
-- SEED: Create first admin user
-- After creating user via Supabase Auth Dashboard,
-- run this to set them as admin:
-- ================================================
-- update public.profiles set role = 'admin' where email = 'admin@yourstore.com';
