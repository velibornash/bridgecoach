"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { Icon } from "@/components/icons/Icon";
import { Info, MessageSquare, Bug, Lightbulb } from "lucide-react";

type ContactType = "support" | "feedback" | "bug" | "feature";

const contactTypes: { id: ContactType; label: string; icon: string; desc: string }[] = [
  { id: "support", label: "Support", icon: "💬", desc: "Get help with your account, billing, or technical issues." },
  { id: "feedback", label: "Feedback", icon: "🎭", desc: "Share your thoughts on how we can improve." },
  { id: "bug", label: "Report Bug", icon: "🐛", desc: "Let us know if something isn't working right." },
  { id: "feature", label: "Feature Request", icon: "💡", desc: "Suggest a new feature or improvement." },
];

export default function ContactPage() {
  const [type, setType] = useState<ContactType>("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast("error", "Please fill in all fields");
      return;
    }
    showToast("success", `Message sent! We'll respond within 24 hours.`);
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
              Have a question or suggestion? We&apos;d love to hear from you.
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
                  <label className="text-xs font-medium text-text-secondary">Email</label>
                  <input
                    value="velja.jagodina@gmail.com"
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
                  <Button type="submit">
                    Send {type === "bug" ? "Bug Report" : type === "feature" ? "Request" : "Message"}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-xs text-text-tertiary">
                Prefer email? Reach us directly at{' '}
                <a href="mailto:velja.jagodina@gmail.com" className="text-primary hover:underline">velja.jagodina@gmail.com</a>
              </p>
            </div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
