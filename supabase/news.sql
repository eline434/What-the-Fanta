-- What the Fanta: news from "Fanta"
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- How to send news as Fanta:
--   Table Editor → news → Insert row → fill in "message" (and optionally "image_url") → Save.
--   Every open app shows it right away as a notification, other apps the next time they open.
--
-- Image: Storage → news-images → Upload → click the file → "Get URL" → paste it in image_url.


create table public.news (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  image_url   text,
  created_at  timestamptz not null default now()
);

alter table public.news enable row level security;

-- Everyone can read the news. There is deliberately NO insert/update/delete policy:
-- app users can't post news. Only you can, through the dashboard (it skips RLS).
create policy "Everyone can read news"
  on public.news for select
  using (true);

-- Supabase Realtime: tell the apps live when a new row is added.
alter publication supabase_realtime add table public.news;

-- A public bucket for news images (you upload them through the dashboard).
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true);

-- A first message, so Home isn't empty.
insert into public.news (message)
values ('Welcome to What the Fanta! 🍊 Rate every Fanta you try and find out where to buy the rarest flavours.');
