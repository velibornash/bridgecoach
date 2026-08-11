import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { AICoach } from "@/components/coach/AICoach";
import { Providers } from "@/providers";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://bridgecoach.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bridge Coach — Master Contract Bridge",
    template: "%s · Bridge Coach",
  },
  description:
    "The modern way to learn Contract Bridge. Interactive lessons, smart quizzes, tactical bidding drills, and an AI coach that guides you from your first trick to tournament play.",
  keywords: [
    "contract bridge",
    "learn bridge",
    "bridge lessons",
    "bridge bidding",
    "bridge training",
    "bridge tactics",
    "duplicate bridge",
    "bridge quiz",
    "bridge coach",
  ],
  authors: [{ name: "Bridge Coach" }],
  creator: "Bridge Coach",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Bridge Coach",
    title: "Bridge Coach — Master Contract Bridge",
    description:
      "Interactive bridge lessons, tactical bidding drills, and a real AI coach. Learn contract bridge the modern way.",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Bridge Coach" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bridge Coach — Master Contract Bridge",
    description:
      "Interactive bridge lessons, tactical bidding drills, and a real AI coach. Learn contract bridge the modern way.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  category: "education",
  appleWebApp: {
    title: "Bridge Coach",
    statusBarStyle: "black-translucent",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Bridge Coach",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      description:
        "Interactive contract bridge learning platform with lessons, tactical drills and an AI coach.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Bridge Coach",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "LearningResource",
      "@id": `${SITE_URL}/#learning-resource`,
      name: "Bridge Coach — Learn Contract Bridge",
      url: SITE_URL,
      description:
        "Interactive bridge lessons, quizzes, tactical bidding drills and AI coaching for contract bridge players.",
      learningResourceType: "Course, Interactive exercises, Quiz",
      provider: { "@id": `${SITE_URL}/#organization` },
      audience: { "@type": "Audience", audienceType: "Bridge players and beginners" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-bg-primary font-sans text-text-primary antialiased transition-colors">
        <JsonLd data={jsonLd} />
        <Providers>
          {children}
          <AICoach />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
