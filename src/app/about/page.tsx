import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg-primary pt-16">
      <Navbar />
      <Container className="py-24">
        <h1 className="text-4xl font-bold text-text-primary">About Bridge Coach</h1>
        <p className="mt-4 text-lg text-text-secondary max-w-2xl">
          We believe learning Contract Bridge should be as addictive as the game itself.
          Built by players, for players — we are modernizing bridge education for the 21st century.
        </p>
      </Container>
      <Footer />
    </main>
  );
}
