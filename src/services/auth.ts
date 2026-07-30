import type { LoginFormData, RegisterFormData, User, ExperienceLevel } from "@/types";

const MOCK_USER: User = {
  id: "user-1",
  firstName: "Bob",
  lastName: "Smith",
  email: "bob@bridgecoach.com",
  avatar: "",
  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  streak: 0,
  joinedAt: new Date().toISOString(),
  country: "US",
  experienceLevel: "new",
  completedLessonIds: [],
  currentLessonId: null,
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockLogin(data: LoginFormData): Promise<{ user: User; token: string }> {
  await delay(1200);

  if (!data.email.includes("@")) {
    throw new Error("Invalid email address");
  }

  if (data.password.length < 6) {
    throw new Error("Invalid credentials");
  }

  return {
    user: { ...MOCK_USER, email: data.email },
    token: "mock-jwt-token-" + Date.now(),
  };
}

export async function mockRegister(data: RegisterFormData): Promise<{ user: User; token: string }> {
  await delay(1500);

  if (!data.email.includes("@")) {
    throw new Error("Please enter a valid email address");
  }

  if (data.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (data.password !== data.repeatPassword) {
    throw new Error("Passwords do not match");
  }

  return {
    user: {
      ...MOCK_USER,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      country: data.country,
      experienceLevel: data.experienceLevel as ExperienceLevel,
    },
    token: "mock-jwt-token-" + Date.now(),
  };
}

export async function mockForgotPassword(email: string): Promise<void> {
  await delay(1000);

  if (!email.includes("@")) {
    throw new Error("Please enter a valid email address");
  }
}

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "At least 8 characters";
  if (!/[A-Z]/.test(password)) return "Needs an uppercase letter";
  if (!/[0-9]/.test(password)) return "Needs a number";
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  return null;
}

export const countries = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
  { value: "DK", label: "Denmark" },
  { value: "NO", label: "Norway" },
  { value: "FI", label: "Finland" },
  { value: "PT", label: "Portugal" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "SG", label: "Singapore" },
  { value: "NZ", label: "New Zealand" },
  { value: "IE", label: "Ireland" },
  { value: "RS", label: "Serbia" },
  { value: "HR", label: "Croatia" },
];

export const experienceLevels = [
  { value: "new", label: "New to Bridge" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
