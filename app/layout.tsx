import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RDB Wiki",
  description: "MySQL, PostgreSQL, Oracle 비교 학습을 위한 기술 문서 위키"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
