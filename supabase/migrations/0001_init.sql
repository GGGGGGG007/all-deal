-- 공동구매(임계치 방식) 앱 초기 스키마

create extension if not exists "pgcrypto";

create type campaign_status as enum ('recruiting', 'confirming', 'charging', 'confirmed', 'failed');
create type charge_status as enum ('pending', 'charged', 'failed');

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  image_url text,
  unit_price integer not null check (unit_price > 0),
  target_count integer not null default 100 check (target_count > 0),
  current_count integer not null default 0,
  status campaign_status not null default 'recruiting',
  deadline_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id),
  phone_number text not null,
  toss_customer_key text not null unique,
  billing_key text not null,
  queue_position integer not null,
  charge_status charge_status not null default 'pending',
  charge_error text,
  charge_attempted_at timestamptz,
  toss_payment_key text,
  created_at timestamptz not null default now(),
  unique (campaign_id, phone_number),
  unique (campaign_id, queue_position)
);

create index participants_campaign_status_idx on participants (campaign_id, charge_status);

create table otp_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id),
  phone_number text not null,
  code_hash text not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index otp_requests_lookup_idx on otp_requests (campaign_id, phone_number, created_at desc);

-- RLS: 공개 읽기는 campaigns만 허용. participants/otp_requests는 service-role(서버)만 접근.
alter table campaigns enable row level security;
alter table participants enable row level security;
alter table otp_requests enable row level security;

create policy "public read campaigns" on campaigns for select using (true);
-- participants, otp_requests: 정책 없음 -> anon/authenticated 키로는 어떤 접근도 불가, service-role만 가능(RLS 우회).

-- ---------------------------------------------------------------------------
-- 핵심 동시성 안전 참여 함수
-- ---------------------------------------------------------------------------
create or replace function join_campaign(
  p_campaign_id uuid,
  p_phone_number text,
  p_billing_key text,
  p_customer_key text
) returns table(queue_position integer, campaign_status campaign_status, participant_id uuid)
language plpgsql
security definer
as $$
declare
  v_campaign campaigns%rowtype;
  v_new_position integer;
  v_participant_id uuid;
  v_new_status campaign_status;
begin
  -- 이 캠페인 행에 잠금을 건다. 동시에 들어온 다른 호출은 이 트랜잭션이 끝날 때까지 여기서 대기한다.
  select * into v_campaign from campaigns where id = p_campaign_id for update;

  if not found then
    raise exception 'CAMPAIGN_NOT_FOUND';
  end if;

  if v_campaign.status <> 'recruiting' then
    raise exception 'CAMPAIGN_NOT_OPEN';
  end if;

  if v_campaign.deadline_at < now() then
    update campaigns set status = 'failed', updated_at = now() where id = p_campaign_id;
    raise exception 'CAMPAIGN_EXPIRED';
  end if;

  if exists (
    select 1 from participants
    where campaign_id = p_campaign_id and phone_number = p_phone_number
  ) then
    raise exception 'ALREADY_JOINED';
  end if;

  v_new_position := v_campaign.current_count + 1;

  insert into participants (campaign_id, phone_number, toss_customer_key, billing_key, queue_position, charge_status)
  values (p_campaign_id, p_phone_number, p_customer_key, p_billing_key, v_new_position, 'pending')
  returning id into v_participant_id;

  v_new_status := case when v_new_position >= v_campaign.target_count then 'confirming' else v_campaign.status end;

  update campaigns
  set current_count = v_new_position, status = v_new_status, updated_at = now()
  where id = p_campaign_id;

  return query select v_new_position, v_new_status, v_participant_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- confirming -> charging 전환 (배치 승인 시작 시 단 한 번만 일어나도록 잠금으로 보호)
-- ---------------------------------------------------------------------------
create or replace function start_charging(p_campaign_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_status campaign_status;
begin
  select status into v_status from campaigns where id = p_campaign_id for update;

  if v_status <> 'confirming' then
    return false;
  end if;

  update campaigns set status = 'charging', updated_at = now() where id = p_campaign_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- charging -> confirmed 완료 처리 (모든 참여자 처리 후 호출)
-- ---------------------------------------------------------------------------
create or replace function finalize_campaign(p_campaign_id uuid)
returns void
language sql
as $$
  update campaigns
  set status = 'confirmed', confirmed_at = now(), updated_at = now()
  where id = p_campaign_id and status = 'charging';
$$;
