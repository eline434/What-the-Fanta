-- What the Fanta: database schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to fill the flavours table.


-- ─── Flavours ────────────────────────────────────────────────────────────────
-- The full Fanta catalogue. Anyone can read it, logged-in users can add new ones.

create table public.flavours (
  id          text primary key,                       -- slug, e.g. 'fanta-orange'
  name        text not null,
  category    text not null default 'other',
  countries   text[] not null default '{}',
  status      text not null default 'limited'
              check (status in ('current', 'regional', 'limited', 'historical')),
  zero_sugar  boolean not null default false,
  image_url   text,
  barcodes    text[] not null default '{}',           -- EAN codes, filled in by the barcode scanner
  created_by  uuid references auth.users on delete set null,  -- null = from the original dataset
  created_at  timestamptz not null default now()
);

alter table public.flavours enable row level security;

create policy "Everyone can read flavours"
  on public.flavours for select
  using (true);

create policy "Logged-in users can add flavours"
  on public.flavours for insert to authenticated
  with check (created_by = auth.uid());

create policy "Logged-in users can add barcodes to flavours"
  on public.flavours for update to authenticated
  using (true);


-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Public info about a user. Supabase keeps email/password in auth.users,
-- this table holds what other users are allowed to see.

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  bio         text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Everyone can read profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

-- Automatically create a profile when someone signs up.
-- The app passes the username along as metadata when calling signUp().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', 'fanta-fan-' || left(new.id::text, 6)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── Check-ins ───────────────────────────────────────────────────────────────
-- "I drank this Fanta": rating, optional photo, optional place where it was bought.
-- Check-ins with a location double as "where can I find this Fanta" on the map.

create table public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles on delete cascade,
  flavour_id  text not null references public.flavours on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '',
  photo_url   text,
  venue_name  text,                                   -- from Foursquare
  latitude    double precision,
  longitude   double precision,
  created_at  timestamptz not null default now()
);

create index check_ins_flavour_idx on public.check_ins (flavour_id, created_at desc);
create index check_ins_user_idx on public.check_ins (user_id, created_at desc);

alter table public.check_ins enable row level security;

create policy "Everyone can read check-ins"
  on public.check_ins for select
  using (true);

create policy "Users can create their own check-ins"
  on public.check_ins for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own check-ins"
  on public.check_ins for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own check-ins"
  on public.check_ins for delete to authenticated
  using (user_id = auth.uid());


-- ─── Photo storage ───────────────────────────────────────────────────────────
-- Public bucket: anyone can view photos, users can only upload into their own folder
-- (photos/<their user id>/<file>.jpg).

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true);

create policy "Users can upload photos into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
