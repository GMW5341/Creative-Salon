import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Creative Salon - 독서모임 플랫폼",
  description: "함께 읽고, 함께 성장하는 독서 커뮤니티 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased bg-gray-50`}>
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
