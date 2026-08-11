import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { WhyBridgeCoach } from "@/components/landing/WhyBridgeCoach";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingPreview } from "@/components/landing/PricingPreview";

export const metadata: Metadata = {
  title: "Master Contract Bridge",
  description:
    "The modern way to learn Contract Bridge. Interactive lessons, smart quizzes, tactical bidding drills, and an AI coach that guides you from your first trick to tournament play.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />
      <WhyBridgeCoach />
      <HowItWorks />
      <Features />
      <Testimonials />
      <PricingPreview />
      <Footer />
    </main>
  );
}
