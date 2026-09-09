"use client";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: {
          objectType: "feed";
          content: {
            title: string;
            description?: string;
            imageUrl: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons?: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

let loadPromise: Promise<void> | null = null;

function loadKakaoSdk(): Promise<void> {
  if (window.Kakao) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("카카오 SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isKakaoShareAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
}

export async function shareToKakao(params: {
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
}): Promise<void> {
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) {
    throw new Error("카카오 공유 설정이 완료되지 않았습니다.");
  }

  await loadKakaoSdk();

  if (!window.Kakao) {
    throw new Error("카카오 SDK를 불러오지 못했습니다.");
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey);
  }

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl || `${new URL(params.url).origin}/og-default.png`,
      link: { mobileWebUrl: params.url, webUrl: params.url },
    },
    buttons: [
      {
        title: "공동구매 참여하기",
        link: { mobileWebUrl: params.url, webUrl: params.url },
      },
    ],
  });
}
