
alter table public.banners add column if not exists duration integer default 5;
comment on column public.banners.duration is 'Duration on screen in seconds';
