-- Migration: create_audit_log
-- File: 20260620234000_create_audit_log.sql

-- Enable the uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";

-- Create the audit_log table
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  user_id uuid,
  details text,
  created_at timestamptz not null default now()
);

-- Function to insert audit entries
create or replace function public.log_audit(
    p_action text,
    p_user_id uuid,
    p_details text
) returns void as $$
begin
  insert into public.audit_log (action, user_id, details) values (p_action, p_user_id, p_details);
end;
$$ language plpgsql security definer;

-- Trigger for devices table (INSERT, UPDATE, DELETE)
create or replace function public.devices_audit_trigger() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    perform public.log_audit('device_created', new.created_by, jsonb_build_object('device_id', new.id, 'name', new.name)::text);
    return new;
  elsif (tg_op = 'UPDATE') then
    perform public.log_audit('device_updated', new.created_by, jsonb_build_object('device_id', new.id, 'changes', hstore(old) - hstore(new))::text);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.log_audit('device_deleted', old.created_by, jsonb_build_object('device_id', old.id, 'name', old.name)::text);
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_devices_audit
  after insert or update or delete on public.devices
  for each row execute function public.devices_audit_trigger();

-- Trigger for orders table (INSERT, UPDATE, DELETE)
create or replace function public.orders_audit_trigger() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    perform public.log_audit('order_created', new.created_by, jsonb_build_object('order_id', new.id)::text);
    return new;
  elsif (tg_op = 'UPDATE') then
    perform public.log_audit('order_updated', new.created_by, jsonb_build_object('order_id', new.id, 'changes', hstore(old) - hstore(new))::text);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.log_audit('order_deleted', old.created_by, jsonb_build_object('order_id', old.id)::text);
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_orders_audit
  after insert or update or delete on public.orders
  for each row execute function public.orders_audit_trigger();

-- Seed some audit entries for demonstration
insert into public.audit_log (action, user_id, details) values
  ('system_init', null, 'Audit log initialized'),
  ('device_created', null, 'Sample device created for demo');
