import { createClient } from "@supabase/supabase-js";

// 브라우저에서 쓰는 anon 클라이언트. campaigns 공개 SELECT만 가능(RLS).
// 실제 Supabase 프로젝트를 연결한 뒤 `npx supabase gen types typescript`로 생성한
// 타입을 createClient 제네릭에 넣으면 쿼리 결과에 완전한 타입이 붙는다. 프로젝트가
// 아직 없어 손으로 쓴 Database 타입이 postgrest-js의 최신 제네릭 제약과 어긋났기 때문에,
// 지금은 비제네릭 클라이언트 + src/types/database.ts의 인터페이스로 수동 캐스팅한다.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 설정되지 않았습니다.");
  }

  return createClient(url, anonKey);
}
