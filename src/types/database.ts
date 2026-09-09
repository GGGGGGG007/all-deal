export type CampaignStatus =
  | "recruiting"
  | "confirming"
  | "charging"
  | "confirmed"
  | "failed";

export type ChargeStatus = "pending" | "charged" | "failed";

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  unit_price: number;
  target_count: number;
  current_count: number;
  status: CampaignStatus;
  deadline_at: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  campaign_id: string;
  phone_number: string;
  toss_customer_key: string;
  billing_key: string;
  queue_position: number;
  charge_status: ChargeStatus;
  charge_error: string | null;
  charge_attempted_at: string | null;
  toss_payment_key: string | null;
  created_at: string;
}

export interface OtpRequest {
  id: string;
  campaign_id: string;
  phone_number: string;
  code_hash: string;
  attempts: number;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

export interface JoinCampaignResult {
  queue_position: number;
  campaign_status: CampaignStatus;
  participant_id: string;
}

// 참고: Supabase 프로젝트를 실제로 만든 뒤 `npx supabase gen types typescript --project-id <id>`
// 로 정확한 타입을 생성해 createClient 제네릭으로 넣으면 쿼리 결과가 자동으로 타입 체크된다.
// 지금은 프로젝트가 없어 위 인터페이스들을 수동 캐스팅용으로만 쓴다 (src/lib/supabase 참고).
