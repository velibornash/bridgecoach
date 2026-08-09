"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { mockLogin, validateEmail } from "@/services/auth";
import { AnimatedSuitsBackground } from "@/components/bridge/AnimatedSuitsBackground";
import { FloatingCards } from "@/components/bridge/FloatingCards";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import { Brain, Trophy, Sparkles, ChevronRight } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Brain, title: "AI Coach", text: "Personal feedback on every bid" },
  { icon: Trophy, title: "Bidding Engine", text: "Legality & strategy, always correct" },
  { icon: Sparkles, title: "Progress", text: "Track lessons, streaks and XP" },
];

function Brand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <motion.div
        whileHover={{ rotate: -8, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow"
      >
        <SuitSymbol suit="♠" size={20} className="text-white drop-shadow" themed={false} />
      </motion.div>
      <div className="leading-tight">
        <span className="block text-lg font-bold tracking-tight text-text-primary">Bridge Coach</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
          Master the game
        </span>
      </div>
    </Link>
  );
}

function ShowcasePanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-col">
      {/* Felt cloth background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#12402F] via-cloth to-[#0A2419]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(196,169,98,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 85%, rgba(45,107,79,0.35) 0%, transparent 60%)",
        }}
      />
      {/* Subtle weave */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <AnimatedSuitsBackground density={14} intensity="medium" />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
        <Brand />

        <div className="max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
              <span className="flex gap-1">
                {(["♠", "♥", "♦", "♣"] as const).map((s) => (
                  <SuitSymbol key={s} suit={s} size={13} />
                ))}
              </span>
              <span className="text-xs font-medium tracking-wide text-primary">Your bridge club, reimagined</span>
            </div>

            <h1 className="text-5xl font-light leading-[1.1] tracking-tight text-white xl:text-6xl">
              Master the game.
              <br />
              <span className="font-semibold bg-gradient-to-r from-primary via-gold to-accent bg-clip-text text-transparent">
                One deal at a time.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">
              Learn to bid with confidence. Every call checked for legality, every
              decision guided by a coach that never gets tired.
            </p>
          </motion.div>

          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-14"
          >
            <FloatingCards className="mx-auto -mt-2 scale-95 xl:scale-100" />
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {HIGHLIGHTS.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.12, duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-white/10"
            >
              <f.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-white">{f.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-white/55">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = useCallback(() => {
    const e = validateEmail(email);
    const p = password ? null : "Password is required";
    setEmailError(e);
    setPasswordError(p);
    return !e && !p;
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await mockLogin({ email, password, rememberMe: false });
      showToast("success", "Welcome back! Redirecting to your dashboard...");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Compact brand for mobile */}
        <div className="mb-8 flex justify-center lg:hidden">
          <Brand />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
          className="rounded-3xl border border-border bg-bg-card/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10"
        >
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1">
              <SuitSymbol suit="♥" size={12} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Player sign in</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Welcome back</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Sign in to continue your bridge journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              error={emailError || undefined}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
              error={passwordError || undefined}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-md border border-border bg-bg-card checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
              {isLoading ? "Signing in…" : (
                <>
                  Sign In
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-card px-4 text-xs text-text-tertiary">or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-secondary hover:border-border-hover">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-secondary hover:border-border-hover">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </button>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Create free account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary lg:grid lg:grid-cols-2">
      <ShowcasePanel />
      <LoginForm />
    </div>
  );
}
