-- Group existing tour records as offers within a customer-facing campaign.
-- Departure schedules and bookings stay attached to the existing tour record.
alter table public.tour_packages
  add column if not exists campaign_name text
  check (campaign_name is null or char_length(campaign_name) between 3 and 140);

create index if not exists tour_packages_campaign_public_idx
  on public.tour_packages (campaign_name, publication_status)
  where campaign_name is not null;
