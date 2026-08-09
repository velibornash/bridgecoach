import { Container } from "@/components/ui/Container";
import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Learning",
    links: [
      { label: "Learning Path", href: "/learning-path" },
      { label: "Quizzes", href: "/quiz" },
      { label: "Daily Challenge", href: "/challenges" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profile", href: "/profile" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "XP & Progress", href: "/xp" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <span className="text-sm font-bold text-white">♠</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-text-primary">
                Bridge Coach
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-text-tertiary">
              Master Contract Bridge. One Trick at a Time.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-semibold text-text-secondary">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-tertiary transition-colors duration-150 hover:text-text-secondary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-8 text-center text-sm text-text-tertiary">
          &copy; {new Date().getFullYear()} Bridge Coach. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
