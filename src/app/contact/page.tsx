"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { submitContactMessage } from "@/services/contactService";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";

type ContactType = "support" | "feedback" | "bug" | "feature";

const contactTypes: { id: ContactType; label: string; icon: string; desc: string }[] = [
  { id: "support", label: "Support", icon: "💬", desc: "Get help with your account, billing, or technical issues." },
  { id: "feedback", label: "Feedback", icon: "🎭", desc: "Share your thoughts on how we can improve." },
  { id: "bug", label: "Report Bug", icon: "🐛", desc: "Let us know if something isn't working right." },
  { id: "feature", label: "Feature Request", icon: "💡", desc: "Suggest a new feature or improvement." },
];

export default function ContactPage() {
  const [type, setType] = useState<ContactType>("support");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot. Hidden from humans, filled by bots.
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);

  /**
   * Really sends it.
   *
   * This used to show "Message sent! We'll respond within 24 hours" and discard
   * the text — no record, no queue, and not even fields to reply to. The message
   * now goes to `ContactMessage`, which the owner reads at `/admin`.
   *
   * The confirmation deliberately does not promise a reply, because nobody has
   * committed to sending one.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      showToast("error", "Please fill in every field");
      return;
    }
    setSending(true);
    const result = await submitContactMessage({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      website,
    });
    setSending(false);
    if (result.error) {
      showToast("error", `Could not send: ${result.error}`);
      return;
    }
    showToast("success", "Message received. It is queued for the owner to read.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Contact Us</h1>
            <p className="text-sm text-text-tertiary mb-8">
              Have a question or suggestion? Send it here and it will be queued for
              the app owner to read. Messages are stored in the application&apos;s
              database, not emailed.
            </p>

            {/* Type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              {contactTypes.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setType(ct.id)}
                  className={`rounded-xl border p-3.5 text-center transition-all ${
                    type === ct.id ? "border-primary bg-primary/10" : "border-border bg-bg-card hover:border-border-hover hover:bg-bg-secondary"
                  }`}
                >
                  <div className="text-xl mb-1">{ct.icon}</div>
                  <p className="text-xs font-medium text-text-primary">{ct.label}</p>
                </button>
              ))}
            </div>

            {/* Active type description */}
            <p className="text-xs text-text-tertiary mb-5">
              {contactTypes.find((ct) => ct.id === type)?.desc}
            </p>

            {/* Form */}
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary">Your name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Bridge"
                    className="mt-1 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
                {/* Honeypot: off-screen, not display:none, so it is filled by bots
                    and skipped by screen readers and humans alike. */}
                <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                  <label htmlFor="company-website">Company website</label>
                  <input
                    id="company-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">
                    Our address
                  </label>
                  <input
                    value={SUPPORT_EMAIL}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-border bg-bg-secondary/50 px-3 py-2.5 text-sm text-text-tertiary outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={`Enter ${type === "bug" ? "the bug title" : type === "feature" ? "your feature idea" : "a brief subject"}`}
                    className="mt-1 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary transition-colors placeholder:text-text-tertiary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder={
                      type === "bug"
                        ? "Describe the bug, steps to reproduce, and what you expected to happen..."
                        : type === "feature"
                          ? "Describe the feature you'd like to see..."
                          : type === "feedback"
                            ? "Share your feedback..."
                            : "Describe your issue..."
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary transition-colors placeholder:text-text-tertiary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="submit" disabled={sending}>
                    Send {type === "bug" ? "Bug Report" : type === "feature" ? "Request" : "Message"}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-xs text-text-tertiary">
                Prefer email? Reach us directly at{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>
              </p>
            </div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
