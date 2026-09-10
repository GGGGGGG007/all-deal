import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공동구매",
  description: "목표 인원이 모이면 확정되는 공동구매",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-app">{children}</body>
    </html>
  );
}
