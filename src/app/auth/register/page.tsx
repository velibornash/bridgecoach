"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { showToast } from "@/components/ui/Toast";
import { mockRegister, validateEmail, validatePassword, validateRequired, countries, experienceLevels } from "@/services/auth";

interface FieldErrors {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  password?: string | null;
  repeatPassword?: string | null;
  country?: string | null;
  experienceLevel?: string | null;
  agreeToTerms?: string | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatPassword: "",
    country: "",
    experienceLevel: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = useCallback((): boolean => {
    const newErrors: FieldErrors = {
      firstName: validateRequired(form.firstName, "First name"),
      lastName: validateRequired(form.lastName, "Last name"),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      repeatPassword: form.repeatPassword !== form.password ? "Passwords do not match" : null,
      country: validateRequired(form.country, "Country"),
      experienceLevel: validateRequired(form.experienceLevel, "Experience level"),
      agreeToTerms: form.agreeToTerms ? null : "You must agree to the terms",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await mockRegister({
        ...form,
        experienceLevel: form.experienceLevel as any,
      });
      showToast("success", "Account created! Welcome to Bridge Coach.");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <Container className="flex flex-1 items-center justify-center relative z-10 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-glow">
                <span className="text-sm font-bold text-white">♠</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-text-primary">
                Bridge Coach
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Start your journey</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Create your free account and begin learning bridge today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Bob"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                error={errors.firstName || undefined}
              />
              <Input
                label="Last Name"
                placeholder="Smith"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                error={errors.lastName || undefined}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email || undefined}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              error={errors.password || undefined}
              hint="At least 8 characters, 1 uppercase, 1 number"
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

            <Input
              label="Repeat Password"
              type={showRepeatPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.repeatPassword}
              onChange={(e) => updateField("repeatPassword", e.target.value)}
              error={errors.repeatPassword || undefined}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showRepeatPassword ? (
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

            <Select
              label="Country"
              placeholder="Select your country"
              options={countries}
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              error={errors.country || undefined}
            />

            <Select
              label="Experience Level"
              placeholder="How much bridge do you know?"
              options={experienceLevels}
              value={form.experienceLevel}
              onChange={(e) => updateField("experienceLevel", e.target.value)}
              error={errors.experienceLevel || undefined}
            />

            <Checkbox
              label={
                <>
                  I agree to the{" "}
                  <Link href="#" className="text-primary hover:text-primary-hover">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:text-primary-hover">
                    Privacy Policy
                  </Link>
                </>
              }
              checked={form.agreeToTerms}
              onChange={(e) => updateField("agreeToTerms", e.target.checked)}
              error={errors.agreeToTerms || undefined}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
              Create Free Account
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-primary px-4 text-xs text-text-tertiary">or sign up with</span>
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

          <p className="mt-8 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
              Log in
            </Link>
          </p>
        </motion.div>
      </Container>
    </div>
  );
}
