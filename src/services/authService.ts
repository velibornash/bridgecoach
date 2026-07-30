import { mockUser } from "./mockData";
import { mockApiCall, simulateDelay } from "./api";
import type { User, AuthState, LoginFormData, RegisterFormData } from "@/types";

const STORAGE_KEY = "bridge_coach_auth";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function loginUser(email: string, password: string) {
  await simulateDelay(300);
  if (email === "bob@bridgecoach.com" && password === "password") {
    const user = { ...mockUser };
    storeUser(user);
    return { data: user, error: null, status: 200 };
  }
  return { data: null, error: "Invalid email or password", status: 401 };
}

export async function registerUser(data: RegisterFormData) {
  await simulateDelay(400);
  const user: User = {
    id: `user-${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    avatar: "",
    level: 1,
    xp: 0,
    xpToNextLevel: 300,
    streak: 0,
    joinedAt: new Date().toISOString().split("T")[0],
    country: data.country,
    experienceLevel: data.experienceLevel,
  };
  storeUser(user);
  return { data: user, error: null, status: 201 };
}

export async function logoutUser() {
  await simulateDelay(100);
  clearStorage();
  return { data: null, error: null, status: 200 };
}

export async function getCurrentUser() {
  await simulateDelay(150);
  const user = getStoredUser() || mockUser;
  return { data: user, error: null, status: 200 };
}

export async function updateProfile(updates: Partial<User>) {
  await simulateDelay(300);
  const current = getStoredUser() || mockUser;
  const updated = { ...current, ...updates };
  storeUser(updated);
  return { data: updated, error: null, status: 200 };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await simulateDelay(300);
  if (currentPassword !== "password") {
    return { data: null, error: "Current password is incorrect", status: 400 };
  }
  return { data: { message: "Password updated successfully" }, error: null, status: 200 };
}

export async function deleteAccount() {
  await simulateDelay(500);
  clearStorage();
  return { data: { message: "Account deleted" }, error: null, status: 200 };
}

export function getAuthState(): AuthState {
  const user = getStoredUser();
  return {
    isAuthenticated: !!user,
    user,
    isLoading: false,
    error: null,
  };
}
