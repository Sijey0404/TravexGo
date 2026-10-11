create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  role text not null default 'customer' check (role in ('administrator', 'staff', 'customer')),
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tour_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination text not null check (char_length(destination) between 2 and 160),
  short_description text not null check (char_length(short_description) <= 300),
  description text not null default '',
  duration_days integer not null check (duration_days > 0),
  duration_nights integer not null check (duration_nights >= 0),
  price_per_person numeric(12,2) not null check (price_per_person > 0),
  minimum_travelers integer not null default 1 check (minimum_travelers > 0),
  maximum_travelers integer not null check (maximum_travelers >= minimum_travelers),
  inclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(inclusions) = 'array'),
  exclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(exclusions) = 'array'),
  itinerary jsonb not null default '[]'::jsonb check (jsonb_typeof(itinerary) = 'array'),
  featured_image_url text,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  cancellation_policy text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (featured_image_url is null or featured_image_url ~ '^https://')
);

create table public.tour_package_images (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.tour_packages(id) on delete restrict,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table public.departure_schedules (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.tour_packages(id) on delete restrict,
  departure_date date not null,
  return_date date,
  departure_time time,
  meeting_point text not null,
  capacity integer not null check (capacity > 0),
  booking_deadline date,
  status text not null default 'open' check (status in ('open', 'full', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (return_date is null or return_date >= departure_date),
  check (booking_deadline is null or booking_deadline <= departure_date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  departure_schedule_id uuid not null references public.departure_schedules(id) on delete restrict,
  traveler_count integer not null check (traveler_count > 0),
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  additional_fees numeric(12,2) not null default 0 check (additional_fees >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  balance_due numeric(12,2) not null check (balance_due >= 0),
  special_requests text,
  status text not null default 'pending' check (status in ('pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled', 'rejected')),
  cancellation_reason text,
  payment_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_amount + additional_fees <= subtotal + additional_fees),
  check (total_amount = subtotal - discount_amount + additional_fees),
  check (amount_paid <= total_amount),
  check (balance_due = total_amount - amount_paid)
);

create table public.booking_travelers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 160),
  age integer check (age is null or age between 0 and 120),
  contact_information text,
  created_at timestamptz not null default now()
);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  old_status text,
  new_status text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('gcash', 'maya', 'bank_transfer', 'cash', 'other')),
  payment_reference text,
  payment_date date not null default current_date,
  verification_status text not null default 'pending_verification' check (verification_status in ('pending_verification', 'verified', 'rejected', 'refunded', 'partially_refunded')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((verification_status <> 'verified') or (verified_by is not null and verified_at is not null))
);

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  storage_path text not null unique,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'processed' check (status in ('pending', 'processed', 'rejected')),
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'processed' or (processed_by is not null and processed_at is not null))
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) <= 2000),
  type text not null check (type in ('booking', 'payment', 'departure', 'account', 'system')),
  related_booking_id uuid references public.bookings(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.departure_schedules(id) on delete restrict,
  staff_id uuid not null references public.profiles(id) on delete restrict,
  assignment_role text not null default 'coordinator' check (assignment_role in ('coordinator', 'guide')),
  created_at timestamptz not null default now(),
  unique (schedule_id, staff_id, assignment_role)
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values ('payment_methods', '["gcash", "maya", "bank_transfer", "cash"]'::jsonb),
       ('deposit_percent', '30'::jsonb)
on conflict (key) do nothing;

create index profiles_role_status_idx on public.profiles (role, account_status);
create index tour_packages_public_idx on public.tour_packages (publication_status, destination);
create index tour_packages_created_at_idx on public.tour_packages (created_at desc);
create index tour_package_images_package_idx on public.tour_package_images (package_id, sort_order);
create index departure_schedules_package_date_idx on public.departure_schedules (package_id, departure_date) where status = 'open';
create index bookings_customer_created_idx on public.bookings (customer_id, created_at desc);
create index bookings_schedule_status_idx on public.bookings (departure_schedule_id, status);
create index bookings_status_created_idx on public.bookings (status, created_at desc);
create index booking_travelers_booking_idx on public.booking_travelers (booking_id);
create index booking_status_history_booking_idx on public.booking_status_history (booking_id, created_at desc);
create index payments_booking_created_idx on public.payments (booking_id, created_at desc);
create index payments_status_date_idx on public.payments (verification_status, payment_date desc);
create index refunds_payment_idx on public.refunds (payment_id, created_at desc);
create index notifications_recipient_unread_idx on public.notifications (recipient_id, created_at desc) where read_at is null;
create index contact_messages_created_status_idx on public.contact_messages (status, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index staff_assignments_staff_idx on public.staff_assignments (staff_id, schedule_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger tour_packages_updated_at before update on public.tour_packages for each row execute function public.set_updated_at();
create trigger departure_schedules_updated_at before update on public.departure_schedules for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), lower(new.email), nullif(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.is_staff_or_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_status = 'active' and p.role in ('administrator', 'staff'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_status = 'active' and p.role = 'administrator');
$$;

create or replace function public.can_access_booking(p_booking_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.bookings b
      join public.departure_schedules d on d.id = b.departure_schedule_id
     where b.id = p_booking_id
       and (b.customer_id = auth.uid() or public.is_admin() or exists (
         select 1 from public.staff_assignments a where a.schedule_id = d.id and a.staff_id = auth.uid()
       ))
  );
$$;

create or replace function public.can_access_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_profile_id = auth.uid()
      or public.is_admin()
      or exists (
        select 1
          from public.bookings customer_booking
          join public.staff_assignments staff_assignment on staff_assignment.schedule_id = customer_booking.departure_schedule_id
         where customer_booking.customer_id = p_profile_id and staff_assignment.staff_id = auth.uid()
      )
      or exists (
        select 1
          from public.staff_assignments own_assignment
          join public.staff_assignments peer_assignment on peer_assignment.schedule_id = own_assignment.schedule_id
         where own_assignment.staff_id = auth.uid() and peer_assignment.staff_id = p_profile_id
      );
$$;

create or replace function public.can_access_package(p_package_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tour_packages p
     where p.id = p_package_id and (
       p.publication_status = 'published' or public.is_admin() or exists (
         select 1 from public.departure_schedules d join public.staff_assignments a on a.schedule_id = d.id
          where d.package_id = p.id and a.staff_id = auth.uid()
       )
     )
  );
$$;

create or replace function public.can_access_departure(p_schedule_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.departure_schedules d
     where d.id = p_schedule_id and (
       (d.status = 'open' and d.departure_date >= current_date and exists (select 1 from public.tour_packages p where p.id = d.package_id and p.publication_status = 'published'))
       or public.is_admin()
       or exists (select 1 from public.staff_assignments a where a.schedule_id = d.id and a.staff_id = auth.uid())
     )
  );
$$;

revoke all on function public.is_staff_or_admin() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_access_booking(uuid) from public;
revoke all on function public.can_access_profile(uuid) from public;
revoke all on function public.can_access_package(uuid) from public;
revoke all on function public.can_access_departure(uuid) from public;
grant execute on function public.is_staff_or_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;
grant execute on function public.can_access_booking(uuid) to authenticated;
grant execute on function public.can_access_profile(uuid) to authenticated;
grant execute on function public.can_access_package(uuid) to authenticated, anon;
grant execute on function public.can_access_departure(uuid) to authenticated, anon;
grant execute on function public.is_staff_or_admin() to anon;

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and not public.is_admin() and (new.role is distinct from old.role or new.account_status is distinct from old.account_status or new.email is distinct from old.email) then
    raise exception 'Profile role, status, and email are managed by authorized account operations' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_privileges before update on public.profiles for each row execute function public.guard_profile_privileges();

create or replace function public.log_audit_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  old_row jsonb;
  new_row jsonb;
  record_id uuid;
  changed text[] := array[]::text[];
  field_name text;
begin
  if tg_op <> 'INSERT' then old_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_row := to_jsonb(new); end if;
  record_id := coalesce((new_row ->> 'id')::uuid, (old_row ->> 'id')::uuid);
  if tg_op = 'UPDATE' then
    for field_name in select keys.name from jsonb_object_keys(new_row) as keys(name) loop
      if new_row -> field_name is distinct from old_row -> field_name then changed := array_append(changed, field_name); end if;
    end loop;
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, record_id, jsonb_build_object('changed_fields', changed));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger audit_booking_changes after insert or update or delete on public.bookings for each row execute function public.log_audit_change();
create trigger audit_payment_changes after insert or update or delete on public.payments for each row execute function public.log_audit_change();
create trigger audit_refund_changes after insert or update or delete on public.refunds for each row execute function public.log_audit_change();
create trigger audit_package_changes after insert or update or delete on public.tour_packages for each row execute function public.log_audit_change();
create trigger audit_profile_changes after update on public.profiles for each row execute function public.log_audit_change();
create trigger audit_staff_assignment_changes after insert or update or delete on public.staff_assignments for each row execute function public.log_audit_change();

create or replace function public.record_booking_status_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, old_status, new_status, actor_id, reason)
    values (new.id, old.status, new.status, auth.uid(), new.cancellation_reason);
  end if;
  return new;
end;
$$;
create trigger booking_status_history_write after update of status on public.bookings for each row execute function public.record_booking_status_change();

create or replace function public.recalculate_booking_balance(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  paid_total numeric(12,2);
begin
  select coalesce(sum(p.amount) filter (where p.verification_status in ('verified', 'partially_refunded', 'refunded')), 0)
       - coalesce((select sum(r.amount) from public.refunds r join public.payments rp on rp.id = r.payment_id where rp.booking_id = p_booking_id and r.status = 'processed'), 0)
    into paid_total
    from public.payments p where p.booking_id = p_booking_id;
  update public.bookings b
     set amount_paid = greatest(0, least(b.total_amount, paid_total)),
         balance_due = b.total_amount - greatest(0, least(b.total_amount, paid_total))
   where b.id = p_booking_id;
end;
$$;
revoke all on function public.recalculate_booking_balance(uuid) from public;

create or replace function public.sync_booking_payment_total()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.recalculate_booking_balance(coalesce(new.booking_id, old.booking_id));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger payments_sync_booking_total after insert or update of amount, verification_status or delete on public.payments for each row execute function public.sync_booking_payment_total();

create or replace function public.sync_booking_refund_total()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  booking_uuid uuid;
begin
  select booking_id into booking_uuid from public.payments where id = coalesce(new.payment_id, old.payment_id);
  if booking_uuid is not null then perform public.recalculate_booking_balance(booking_uuid); end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger refunds_sync_booking_total after insert or update of amount, status or delete on public.refunds for each row execute function public.sync_booking_refund_total();

create or replace function public.create_booking(p_schedule_id uuid, p_traveler_count integer, p_special_requests text default null, p_traveler_names jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  customer_uuid uuid := auth.uid();
  schedule_row public.departure_schedules%rowtype;
  package_row public.tour_packages%rowtype;
  occupied integer;
  booking_uuid uuid;
  booking_ref text;
  total numeric(12,2);
  expired_booking record;
  traveler_name text;
begin
  if customer_uuid is null then raise exception 'Sign in before requesting a booking' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles where id = customer_uuid and role = 'customer' and account_status = 'active') then raise exception 'Active customer account required' using errcode = '42501'; end if;
  if p_traveler_count is null or p_traveler_count < 1 or p_traveler_names is null or jsonb_typeof(p_traveler_names) <> 'array' or jsonb_array_length(p_traveler_names) <> p_traveler_count then raise exception 'Provide one traveler name for each traveler' using errcode = '22023'; end if;
  select * into schedule_row from public.departure_schedules where id = p_schedule_id for update;
  if not found then raise exception 'This departure is no longer available' using errcode = 'P0001'; end if;
  for expired_booking in
    update public.bookings
       set status = 'cancelled', cancellation_reason = 'Automatically expired after the payment deadline'
     where departure_schedule_id = p_schedule_id
       and status in ('pending', 'awaiting_payment')
       and payment_deadline is not null
       and payment_deadline < now()
     returning id, customer_id, booking_reference
  loop
    insert into public.notifications (recipient_id, title, message, type, related_booking_id)
    values (expired_booking.customer_id, 'Booking request expired', 'Booking ' || expired_booking.booking_reference || ' expired after its payment deadline.', 'booking', expired_booking.id);
  end loop;
  select * into schedule_row from public.departure_schedules where id = p_schedule_id;
  if schedule_row.status <> 'open' then raise exception 'This departure is no longer open' using errcode = 'P0001'; end if;
  if schedule_row.departure_date < current_date or (schedule_row.booking_deadline is not null and schedule_row.booking_deadline < current_date) then raise exception 'The booking deadline has passed' using errcode = 'P0001'; end if;
  select * into package_row from public.tour_packages where id = schedule_row.package_id and publication_status = 'published';
  if not found then raise exception 'This package is not available' using errcode = 'P0001'; end if;
  if p_traveler_count < package_row.minimum_travelers or p_traveler_count > package_row.maximum_travelers then raise exception 'Traveler count is outside the package limits' using errcode = '22023'; end if;
  select coalesce(sum(b.traveler_count), 0)::integer into occupied from public.bookings b where b.departure_schedule_id = p_schedule_id and b.status in ('pending', 'awaiting_payment', 'confirmed') and (b.status = 'confirmed' or b.payment_deadline is null or b.payment_deadline >= now());
  if occupied + p_traveler_count > schedule_row.capacity then raise exception 'There are not enough seats remaining' using errcode = 'P0001'; end if;
  total := round(package_row.price_per_person * p_traveler_count, 2);
  booking_uuid := gen_random_uuid();
  booking_ref := 'TG-' || to_char(clock_timestamp(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.bookings (id, booking_reference, customer_id, departure_schedule_id, traveler_count, unit_price_snapshot, subtotal, total_amount, balance_due, special_requests, payment_deadline)
  values (booking_uuid, booking_ref, customer_uuid, p_schedule_id, p_traveler_count, package_row.price_per_person, total, total, total, nullif(left(p_special_requests, 1000), ''), least(coalesce(schedule_row.booking_deadline::timestamptz, now() + interval '3 days'), now() + interval '3 days'));
  for traveler_name in select btrim(name) from jsonb_array_elements_text(p_traveler_names) as travelers(name) loop
    if char_length(traveler_name) < 2 or char_length(traveler_name) > 160 then raise exception 'Traveler names must be between 2 and 160 characters' using errcode = '22023'; end if;
    insert into public.booking_travelers (booking_id, full_name) values (booking_uuid, traveler_name);
  end loop;
  insert into public.booking_status_history (booking_id, old_status, new_status, actor_id) values (booking_uuid, null, 'pending', customer_uuid);
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  values (customer_uuid, 'Booking request received', 'Your request ' || booking_ref || ' is awaiting review.', 'booking', booking_uuid);
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  select p.id, 'New booking request', 'Booking ' || booking_ref || ' needs review.', 'booking', booking_uuid
    from public.profiles p
   where p.account_status = 'active' and (p.role = 'administrator' or exists (select 1 from public.staff_assignments a where a.staff_id = p.id and a.schedule_id = p_schedule_id));
  return booking_uuid;
end;
$$;

create or replace function public.refresh_departure_availability()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  schedule_uuid uuid;
begin
  if tg_op <> 'INSERT' then
    update public.departure_schedules d
       set status = case when d.status in ('cancelled', 'completed') then d.status
                         when coalesce((select sum(b.traveler_count) from public.bookings b where b.departure_schedule_id = d.id and b.status in ('pending', 'awaiting_payment', 'confirmed')), 0) >= d.capacity then 'full'
                         else 'open' end
     where d.id = old.departure_schedule_id;
  end if;
  if tg_op <> 'DELETE' then
    schedule_uuid := new.departure_schedule_id;
    update public.departure_schedules d
       set status = case when d.status in ('cancelled', 'completed') then d.status
                         when coalesce((select sum(b.traveler_count) from public.bookings b where b.departure_schedule_id = d.id and b.status in ('pending', 'awaiting_payment', 'confirmed')), 0) >= d.capacity then 'full'
                         else 'open' end
     where d.id = schedule_uuid;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger bookings_refresh_departure after insert or update of status, traveler_count, departure_schedule_id or delete on public.bookings for each row execute function public.refresh_departure_availability();

create or replace function public.get_public_departures(p_package_id uuid default null)
returns table (
  id uuid, package_id uuid, departure_date date, return_date date, departure_time time,
  meeting_point text, capacity integer, remaining_seats integer, booking_deadline date,
  status text, created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp as $$
  select d.id, d.package_id, d.departure_date, d.return_date, d.departure_time, d.meeting_point,
         d.capacity, greatest(d.capacity - coalesce(sum(b.traveler_count), 0), 0)::integer,
         d.booking_deadline, d.status, d.created_at, d.updated_at
    from public.departure_schedules d
    join public.tour_packages p on p.id = d.package_id and p.publication_status = 'published'
    left join public.bookings b on b.departure_schedule_id = d.id and b.status in ('pending', 'awaiting_payment', 'confirmed') and (b.status = 'confirmed' or b.payment_deadline is null or b.payment_deadline >= now())
  where (p_package_id is null or d.package_id = p_package_id) and d.status in ('open', 'full') and d.departure_date >= current_date
     and (d.booking_deadline is null or d.booking_deadline >= current_date)
   group by d.id
  having coalesce(sum(b.traveler_count), 0) < d.capacity
   order by d.departure_date;
$$;

create or replace function public.set_booking_status(p_booking_id uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  current_status text;
  booking_ref text;
  customer_uuid uuid;
begin
  if not public.is_staff_or_admin() then raise exception 'Staff authorization required' using errcode = '42501'; end if;
  if p_status not in ('awaiting_payment', 'confirmed', 'completed', 'cancelled', 'rejected') then raise exception 'Invalid booking status' using errcode = '22023'; end if;
  select b.status, b.booking_reference, b.customer_id into current_status, booking_ref, customer_uuid
    from public.bookings b
    join public.departure_schedules d on d.id = b.departure_schedule_id
   where b.id = p_booking_id and (public.is_admin() or exists (select 1 from public.staff_assignments a where a.schedule_id = d.id and a.staff_id = auth.uid()))
   for update of b;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;
  if not ((current_status = 'pending' and p_status in ('awaiting_payment', 'confirmed', 'rejected', 'cancelled')) or
          (current_status = 'awaiting_payment' and p_status in ('confirmed', 'rejected', 'cancelled')) or
          (current_status = 'confirmed' and p_status in ('completed', 'cancelled'))) then
    raise exception 'Invalid booking status transition: % to %', current_status, p_status using errcode = '22023';
  end if;
  update public.bookings set status = p_status, cancellation_reason = case when p_status in ('cancelled', 'rejected') then nullif(left(p_reason, 1000), '') else cancellation_reason end where id = p_booking_id;
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  values (customer_uuid, 'Booking status updated', 'Booking ' || booking_ref || ' is now ' || replace(p_status, '_', ' ') || '.', 'booking', p_booking_id);
end;
$$;

create or replace function public.cancel_my_booking(p_booking_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  booking_row public.bookings%rowtype;
  trip_date date;
begin
  if auth.uid() is null then raise exception 'Sign in to cancel a booking' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'customer' and account_status = 'active') then raise exception 'Active customer account required' using errcode = '42501'; end if;
  select * into booking_row from public.bookings where id = p_booking_id and customer_id = auth.uid() for update;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;
  select departure_date into trip_date from public.departure_schedules where id = booking_row.departure_schedule_id;
  if not ((booking_row.status in ('pending', 'awaiting_payment') and booking_row.amount_paid = 0) or (booking_row.status = 'confirmed' and booking_row.amount_paid = 0 and trip_date > current_date + 7)) then
    raise exception 'This booking is outside the self-service cancellation window; contact TravexGo' using errcode = '22023';
  end if;
  update public.bookings set status = 'cancelled', cancellation_reason = nullif(left(p_reason, 1000), '') where id = p_booking_id;
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  values (auth.uid(), 'Booking cancelled', 'Booking ' || booking_row.booking_reference || ' has been cancelled.', 'booking', p_booking_id);
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  select p.id, 'Booking cancellation requested', 'Booking ' || booking_row.booking_reference || ' was cancelled by the customer.', 'booking', p_booking_id
    from public.profiles p
   where p.account_status = 'active' and (p.role = 'administrator' or exists (select 1 from public.staff_assignments a where a.staff_id = p.id and a.schedule_id = booking_row.departure_schedule_id));
end;
$$;

create or replace function public.submit_payment(p_booking_id uuid, p_amount numeric, p_payment_method text, p_payment_reference text, p_receipt_path text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  booking_row public.bookings%rowtype;
  payment_uuid uuid;
  already_submitted numeric(12,2);
begin
  if auth.uid() is null then raise exception 'Sign in before submitting payment evidence' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'customer' and account_status = 'active') then raise exception 'Active customer account required' using errcode = '42501'; end if;
  select * into booking_row from public.bookings where id = p_booking_id and customer_id = auth.uid() for update;
  if not found or booking_row.status not in ('pending', 'awaiting_payment', 'confirmed') then raise exception 'This booking cannot accept payment' using errcode = '42501'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > booking_row.balance_due then raise exception 'Payment amount exceeds the remaining balance' using errcode = '22023'; end if;
  if p_payment_method not in ('gcash', 'maya', 'bank_transfer', 'cash') then raise exception 'Unsupported payment method' using errcode = '22023'; end if;
  if p_receipt_path not like auth.uid()::text || '/%' then raise exception 'Invalid receipt path' using errcode = '42501'; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'payment-receipts' and o.name = p_receipt_path) then raise exception 'Uploaded receipt was not found' using errcode = '22023'; end if;
  select coalesce(sum(p.amount) filter (where p.verification_status in ('pending_verification', 'verified', 'partially_refunded', 'refunded')), 0)
       - coalesce((select sum(r.amount) from public.refunds r join public.payments rp on rp.id = r.payment_id where rp.booking_id = p_booking_id and r.status = 'processed'), 0)
    into already_submitted from public.payments p where p.booking_id = p_booking_id;
  if p_amount > booking_row.total_amount - already_submitted then raise exception 'There is already a payment pending review for this amount' using errcode = '22023'; end if;
  insert into public.payments (booking_id, amount, payment_method, payment_reference) values (p_booking_id, p_amount, p_payment_method, nullif(left(p_payment_reference, 120), '')) returning id into payment_uuid;
  insert into public.payment_receipts (payment_id, storage_path, uploaded_by) values (payment_uuid, p_receipt_path, auth.uid());
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  values (auth.uid(), 'Payment evidence received', 'Your payment evidence is waiting for manual review.', 'payment', p_booking_id);
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  select p.id, 'Payment evidence to review', 'A payment for booking ' || booking_row.booking_reference || ' needs verification.', 'payment', p_booking_id
    from public.profiles p
   where p.account_status = 'active' and (p.role = 'administrator' or exists (select 1 from public.staff_assignments a where a.staff_id = p.id and a.schedule_id = booking_row.departure_schedule_id));
  return payment_uuid;
end;
$$;

create or replace function public.record_manual_payment(p_booking_id uuid, p_amount numeric, p_payment_method text, p_payment_reference text, p_payment_date date)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  booking_row public.bookings%rowtype;
  payment_uuid uuid;
  pending_total numeric(12,2);
begin
  if not public.is_staff_or_admin() then raise exception 'Staff authorization required' using errcode = '42501'; end if;
  select * into booking_row from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;
  if not public.can_access_booking(p_booking_id) then raise exception 'This booking is not assigned to your staff account' using errcode = '42501'; end if;
  if booking_row.status in ('cancelled', 'rejected', 'completed') then raise exception 'This booking cannot accept a payment' using errcode = '22023'; end if;
  select coalesce(sum(amount), 0) into pending_total from public.payments where booking_id = p_booking_id and verification_status = 'pending_verification';
  if p_amount is null or p_amount <= 0 or p_amount > booking_row.balance_due - pending_total then raise exception 'Payment amount exceeds the remaining balance after pending evidence' using errcode = '22023'; end if;
  if p_payment_method not in ('gcash', 'maya', 'bank_transfer', 'cash', 'other') then raise exception 'Unsupported payment method' using errcode = '22023'; end if;
  if p_payment_date is null or p_payment_date > current_date then raise exception 'Payment date must be today or earlier' using errcode = '22023'; end if;
  insert into public.payments (booking_id, amount, payment_method, payment_reference, payment_date, verification_status, verified_by, verified_at)
  values (p_booking_id, p_amount, p_payment_method, nullif(left(p_payment_reference, 120), ''), p_payment_date, 'verified', auth.uid(), now())
  returning id into payment_uuid;
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  values (booking_row.customer_id, 'Payment recorded', 'A staff member recorded a ' || replace(p_payment_method, '_', ' ') || ' payment for booking ' || booking_row.booking_reference || '.', 'payment', p_booking_id);
  return payment_uuid;
end;
$$;

create or replace function public.verify_payment(p_payment_id uuid, p_approved boolean, p_rejection_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  payment_row public.payments%rowtype;
  customer_uuid uuid;
  booking_ref text;
begin
  if not public.is_staff_or_admin() then raise exception 'Staff authorization required' using errcode = '42501'; end if;
  select * into payment_row from public.payments where id = p_payment_id for update;
  if not found or payment_row.verification_status <> 'pending_verification' then raise exception 'Payment is not awaiting verification' using errcode = '22023'; end if;
  if not public.is_admin() and not public.can_access_booking(payment_row.booking_id) then raise exception 'This booking is not assigned to your staff account' using errcode = '42501'; end if;
  select customer_id, booking_reference into customer_uuid, booking_ref from public.bookings where id = payment_row.booking_id;
  if p_approved then
    update public.payments set verification_status = 'verified', verified_by = auth.uid(), verified_at = now(), rejection_reason = null where id = p_payment_id;
  else
    if char_length(trim(coalesce(p_rejection_reason, ''))) < 3 then raise exception 'A rejection reason is required' using errcode = '22023'; end if;
    update public.payments set verification_status = 'rejected', verified_by = auth.uid(), verified_at = now(), rejection_reason = left(trim(p_rejection_reason), 1000) where id = p_payment_id;
  end if;
  insert into public.notifications (recipient_id, title, message, type, related_booking_id)
  values (customer_uuid, case when p_approved then 'Payment verified' else 'Payment evidence needs attention' end,
          case when p_approved then 'A payment for booking ' || booking_ref || ' was verified. Booking confirmation is separate.' else 'Payment evidence for booking ' || booking_ref || ' was rejected: ' || left(trim(p_rejection_reason), 500) end,
          'payment', payment_row.booking_id);
end;
$$;

create or replace function public.record_refund(p_payment_id uuid, p_amount numeric, p_reason text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  payment_row public.payments%rowtype;
  previously_refunded numeric(12,2);
  refund_uuid uuid;
begin
  if not public.is_admin() then raise exception 'Administrator authorization required' using errcode = '42501'; end if;
  select * into payment_row from public.payments where id = p_payment_id for update;
  if not found or payment_row.verification_status not in ('verified', 'partially_refunded') then raise exception 'Only verified payments can be refunded' using errcode = '22023'; end if;
  select coalesce(sum(amount), 0) into previously_refunded from public.refunds where payment_id = p_payment_id and status = 'processed';
  if p_amount is null or p_amount <= 0 or p_amount > payment_row.amount - previously_refunded then raise exception 'Refund exceeds the refundable amount' using errcode = '22023'; end if;
  insert into public.refunds (payment_id, amount, reason, status, processed_by, processed_at) values (p_payment_id, p_amount, left(trim(p_reason), 1000), 'processed', auth.uid(), now()) returning id into refund_uuid;
  select coalesce(sum(amount), 0) into previously_refunded from public.refunds where payment_id = p_payment_id and status = 'processed';
  update public.payments set verification_status = case when previously_refunded >= payment_row.amount then 'refunded' else 'partially_refunded' end where id = p_payment_id;
  return refund_uuid;
end;
$$;

create or replace function public.set_profile_access(p_profile_id uuid, p_role text, p_account_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  current_role text;
  current_status text;
begin
  if not public.is_admin() then raise exception 'Administrator authorization required' using errcode = '42501'; end if;
  if p_role not in ('administrator', 'staff', 'customer') or p_account_status not in ('active', 'suspended') then raise exception 'Invalid role or account status' using errcode = '22023'; end if;
  select role, account_status into current_role, current_status from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  if current_role = 'administrator' and current_status = 'active' and (p_role <> 'administrator' or p_account_status <> 'active')
     and (select count(*) from public.profiles where role = 'administrator' and account_status = 'active') <= 1 then
    raise exception 'The last active administrator cannot be demoted or suspended' using errcode = '22023';
  end if;
  update public.profiles set role = p_role, account_status = p_account_status where id = p_profile_id;
end;
$$;

create or replace function public.submit_contact_message(p_name text, p_email text, p_subject text, p_message text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  message_uuid uuid;
  normalized_email text := lower(trim(p_email));
begin
  if char_length(trim(p_name)) not between 2 and 160 or char_length(normalized_email) > 254 or normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' or char_length(trim(p_subject)) not between 3 and 200 or char_length(trim(p_message)) not between 10 and 5000 then
    raise exception 'Please provide valid contact details and a message' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(normalized_email, 0));
  if (select count(*) from public.contact_messages where email = normalized_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many messages from this address. Please try again later.' using errcode = '42900';
  end if;
  insert into public.contact_messages (name, email, subject, message) values (trim(p_name), normalized_email, trim(p_subject), trim(p_message)) returning id into message_uuid;
  return message_uuid;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.notifications set read_at = coalesce(read_at, now()) where id = p_notification_id and recipient_id = auth.uid();
  if not found then raise exception 'Notification not found' using errcode = 'P0002'; end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.tour_packages enable row level security;
alter table public.tour_package_images enable row level security;
alter table public.departure_schedules enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_travelers enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.refunds enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.system_settings enable row level security;

create policy "profiles_read_authorized" on public.profiles for select to authenticated using (public.can_access_profile(id));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_manage" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "packages_public_read_published" on public.tour_packages for select to anon, authenticated using (public.can_access_package(id));
create policy "packages_admin_insert" on public.tour_packages for insert to authenticated with check (public.is_admin());
create policy "packages_admin_update" on public.tour_packages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "packages_admin_delete" on public.tour_packages for delete to authenticated using (public.is_admin());
create policy "package_images_public_read" on public.tour_package_images for select to anon, authenticated using (public.can_access_package(package_id));
create policy "package_images_admin_manage" on public.tour_package_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "departures_public_read_open" on public.departure_schedules for select to anon, authenticated using (public.can_access_departure(id));
create policy "departures_admin_insert" on public.departure_schedules for insert to authenticated with check (public.is_admin());
create policy "departures_assigned_update" on public.departure_schedules for update to authenticated using (public.is_admin() or exists (select 1 from public.staff_assignments a where a.schedule_id = departure_schedules.id and a.staff_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.staff_assignments a where a.schedule_id = departure_schedules.id and a.staff_id = auth.uid()));
create policy "departures_admin_delete" on public.departure_schedules for delete to authenticated using (public.is_admin());

create policy "bookings_read_owner_or_staff" on public.bookings for select to authenticated using (public.can_access_booking(id));
create policy "travelers_read_owner_or_staff" on public.booking_travelers for select to authenticated using (public.can_access_booking(booking_id));
create policy "booking_history_read_owner_or_staff" on public.booking_status_history for select to authenticated using (public.can_access_booking(booking_id));
create policy "payments_read_owner_or_staff" on public.payments for select to authenticated using (public.can_access_booking(booking_id));
create policy "payment_receipts_read_owner_or_staff" on public.payment_receipts for select to authenticated using (uploaded_by = auth.uid() or exists (select 1 from public.payments p where p.id = payment_id and public.can_access_booking(p.booking_id)));
create policy "refunds_read_owner_or_staff" on public.refunds for select to authenticated using (exists (select 1 from public.payments p where p.id = payment_id and public.can_access_booking(p.booking_id)));

create policy "notifications_read_own" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "contact_staff_read" on public.contact_messages for select to authenticated using (public.is_staff_or_admin());
create policy "contact_staff_update" on public.contact_messages for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "audit_admin_read" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "assignment_read_self_or_admin" on public.staff_assignments for select to authenticated using (staff_id = auth.uid() or public.is_admin());
create policy "assignment_admin_manage" on public.staff_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings_staff_read" on public.system_settings for select to authenticated using (public.is_staff_or_admin());
create policy "settings_admin_manage" on public.system_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.tour_packages, public.tour_package_images, public.departure_schedules to anon, authenticated;
grant select on public.profiles, public.bookings, public.booking_travelers, public.booking_status_history, public.payments, public.payment_receipts, public.refunds, public.notifications, public.contact_messages, public.audit_logs, public.staff_assignments, public.system_settings to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert, update on public.tour_packages, public.departure_schedules to authenticated;
grant delete on public.tour_packages, public.tour_package_images, public.departure_schedules to authenticated;
grant insert, update, delete on public.tour_package_images to authenticated;
grant update (status) on public.contact_messages to authenticated;
grant update on public.staff_assignments, public.system_settings to authenticated;
grant insert, delete on public.staff_assignments to authenticated;

revoke all on function public.create_booking(uuid, integer, text, jsonb) from public;
revoke all on function public.set_booking_status(uuid, text, text) from public;
revoke all on function public.cancel_my_booking(uuid, text) from public;
revoke all on function public.submit_payment(uuid, numeric, text, text, text) from public;
revoke all on function public.record_manual_payment(uuid, numeric, text, text, date) from public;
revoke all on function public.verify_payment(uuid, boolean, text) from public;
revoke all on function public.record_refund(uuid, numeric, text) from public;
revoke all on function public.set_profile_access(uuid, text, text) from public;
revoke all on function public.submit_contact_message(text, text, text, text) from public;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.create_booking(uuid, integer, text, jsonb) to authenticated;
grant execute on function public.get_public_departures(uuid) to anon, authenticated;
grant execute on function public.set_booking_status(uuid, text, text) to authenticated;
grant execute on function public.cancel_my_booking(uuid, text) to authenticated;
grant execute on function public.submit_payment(uuid, numeric, text, text, text) to authenticated;
grant execute on function public.record_manual_payment(uuid, numeric, text, text, date) to authenticated;
grant execute on function public.verify_payment(uuid, boolean, text) to authenticated;
grant execute on function public.record_refund(uuid, numeric, text) to authenticated;
grant execute on function public.set_profile_access(uuid, text, text) to authenticated;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('package-images', 'package-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
       ('payment-receipts', 'payment-receipts', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "package_images_public_objects_read" on storage.objects for select to anon, authenticated using (bucket_id = 'package-images');
create policy "package_images_admin_objects_insert" on storage.objects for insert to authenticated with check (bucket_id = 'package-images' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "package_images_admin_objects_update" on storage.objects for update to authenticated using (bucket_id = 'package-images' and public.is_admin()) with check (bucket_id = 'package-images' and public.is_admin());
create policy "package_images_admin_objects_delete" on storage.objects for delete to authenticated using (bucket_id = 'package-images' and public.is_admin());
create policy "payment_receipt_owner_upload" on storage.objects for insert to authenticated with check (bucket_id = 'payment-receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "payment_receipt_owner_or_staff_read" on storage.objects for select to authenticated using (
  bucket_id = 'payment-receipts' and (
    exists (
      select 1 from public.payment_receipts r join public.payments p on p.id = r.payment_id join public.bookings b on b.id = p.booking_id
      where r.storage_path = name and public.can_access_booking(b.id)
    )
  )
);
create policy "payment_receipt_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'payment-receipts' and public.is_admin());
create policy "payment_receipt_owner_delete_unlinked" on storage.objects for delete to authenticated using (
  bucket_id = 'payment-receipts' and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (select 1 from public.payment_receipts r where r.storage_path = name)
);