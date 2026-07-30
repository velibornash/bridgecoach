import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { WhyBridgeCoach } from "@/components/landing/WhyBridgeCoach";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingPreview } from "@/components/landing/PricingPreview";

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
