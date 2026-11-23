-- Extend the current offer rows instead of replacing their booking relationships.
alter table public.tour_packages
  add column if not exists countries text[] not null default '{}',
  add column if not exists package_category text not null default 'custom';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tour_packages_category_length_check' and conrelid = 'public.tour_packages'::regclass) then
    alter table public.tour_packages add constraint tour_packages_category_length_check
      check (char_length(package_category) between 2 and 80);
  end if;
end $$;

create index if not exists tour_packages_category_public_idx
  on public.tour_packages (package_category, publication_status);

comment on column public.tour_packages.itinerary is
  'Offer-specific JSON itinerary: days contain locations and nested activities, plus optional transport, accommodation, meals and image URLs.';
