import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버에서만 쓰는 service-role 클라이언트. RLS를 우회하므로 절대 클라이언트로 노출 금지.
// 비제네릭 클라이언트를 쓰는 이유는 src/lib/supabase/client.ts 주석 참고.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
