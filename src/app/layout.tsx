import type { Metadata } from "next";
import { Geist, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Yasmin",
  description: "Send and receive money instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${notoArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
