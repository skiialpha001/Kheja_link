-- Reserve a payment-attempt row in the same transaction as all rate-limit
-- checks. Advisory locks serialize requests that share a reference, account,
-- or phone fingerprint, preventing concurrent calls from overshooting limits.
create or replace function public.reserve_payment_attempt(
  p_reference text,
  p_user_id uuid,
  p_product text,
  p_channel text,
  p_reference_max integer,
  p_reference_minutes integer,
  p_user_max integer,
  p_user_minutes integer,
  p_msisdn_hash text default null,
  p_msisdn_max integer default null,
  p_msisdn_minutes integer default null,
  p_message text default null
)
returns table (allowed boolean, attempt_id uuid, limited_scope text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_count bigint;
  v_attempt_id uuid;
begin
  if p_reference is null or p_reference !~* '^k[lh]_[a-z0-9_]{6,80}$'
     or p_user_id is null
     or p_product is null or p_product not in ('hunting_fee', 'contact_unlock')
     or p_channel is null or p_channel not in ('mobile_money', 'card', 'checkout')
     or p_reference_max is null or p_reference_max < 1
     or p_reference_minutes is null or p_reference_minutes < 1
     or p_user_max is null or p_user_max < 1
     or p_user_minutes is null or p_user_minutes < 1 then
    raise exception 'Invalid payment attempt reservation parameters.'
      using errcode = '22023';
  end if;

  if (p_msisdn_hash is null and (p_msisdn_max is not null or p_msisdn_minutes is not null))
     or (p_msisdn_hash is not null and
         (p_msisdn_max is null or p_msisdn_max < 1 or p_msisdn_minutes is null or p_msisdn_minutes < 1)) then
    raise exception 'Invalid phone rate-limit parameters.'
      using errcode = '22023';
  end if;

  -- Every caller acquires locks in this fixed order to avoid deadlocks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'khejalink:payment:reference:' || p_channel || ':' || p_reference, 0
  ));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'khejalink:payment:user:' || p_channel || ':' || p_user_id::text, 0
  ));
  if p_msisdn_hash is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
      'khejalink:payment:phone:' || p_channel || ':' || p_msisdn_hash, 0
    ));
  end if;

  select count(*) into v_count
    from public.payment_attempts pa
   where pa.reference = p_reference
     and pa.channel = p_channel
     and pa.created_at >= pg_catalog.statement_timestamp() - (p_reference_minutes * interval '1 minute');
  if v_count >= p_reference_max then
    return query select false, null::uuid, 'reference'::text;
    return;
  end if;

  select count(*) into v_count
    from public.payment_attempts pa
   where pa.user_id = p_user_id
     and pa.channel = p_channel
     and pa.created_at >= pg_catalog.statement_timestamp() - (p_user_minutes * interval '1 minute');
  if v_count >= p_user_max then
    return query select false, null::uuid, 'user'::text;
    return;
  end if;

  if p_msisdn_hash is not null then
    select count(*) into v_count
      from public.payment_attempts pa
     where pa.msisdn_hash = p_msisdn_hash
       and pa.channel = p_channel
       and pa.created_at >= pg_catalog.statement_timestamp() - (p_msisdn_minutes * interval '1 minute');
    if v_count >= p_msisdn_max then
      return query select false, null::uuid, 'msisdn'::text;
      return;
    end if;
  end if;

  insert into public.payment_attempts (
    reference, product, channel, status, message, user_id, msisdn_hash
  ) values (
    p_reference, p_product, p_channel, 'pending', p_message, p_user_id, p_msisdn_hash
  )
  returning id into v_attempt_id;

  return query select true, v_attempt_id, null::text;
end;
$function$;

alter function public.reserve_payment_attempt(
  text, uuid, text, text, integer, integer, integer, integer, text, integer, integer, text
) owner to postgres;

revoke all on function public.reserve_payment_attempt(
  text, uuid, text, text, integer, integer, integer, integer, text, integer, integer, text
) from public, anon, authenticated;
grant execute on function public.reserve_payment_attempt(
  text, uuid, text, text, integer, integer, integer, integer, text, integer, integer, text
) to service_role;
