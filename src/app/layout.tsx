import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { AICoach } from "@/components/coach/AICoach";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bridge Coach — Master Contract Bridge",
  description:
    "The modern way to learn Contract Bridge. Interactive lessons, smart quizzes, and an AI coach that guides you from your first trick to tournament play.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-bg-primary font-sans text-text-primary antialiased">
        {children}
        <AICoach />
        <ToastContainer />
      </body>
    </html>
  );
}
