/**
 * Auth integration tests — the mock auth service contract.
 */
import { describe, expect, it } from "vitest";
import {
  mockLogin,
  mockRegister,
  mockForgotPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/services/auth";

describe("mockLogin", () => {
  it("returns a user and token for valid credentials", async () => {
    const { user, token } = await mockLogin({ email: "bob@bridgecoach.com", password: "secret1", rememberMe: true });
    expect(user.id).toBe("user-1");
    expect(user.email).toBe("bob@bridgecoach.com");
    expect(token.startsWith("mock-jwt-token-")).toBe(true);
  });

  it("rejects an invalid email", async () => {
    await expect(mockLogin({ email: "not-an-email", password: "secret1", rememberMe: false })).rejects.toThrow("Invalid email");
  });

  it("rejects a short password", async () => {
    await expect(mockLogin({ email: "bob@bridgecoach.com", password: "123", rememberMe: false })).rejects.toThrow("Invalid credentials");
  });
});

describe("mockRegister", () => {
  it("returns a user for a valid registration", async () => {
    const { user } = await mockRegister({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@bridgecoach.com",
      password: "password1",
      repeatPassword: "password1",
      country: "US",
      experienceLevel: "beginner",
      agreeToTerms: true,
    });
    expect(user.firstName).toBe("Ada");
    expect(user.email).toBe("ada@bridgecoach.com");
  });

  it("rejects mismatched passwords", async () => {
    await expect(
      mockRegister({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@bridgecoach.com",
        password: "password1",
        repeatPassword: "password2",
        country: "US",
        experienceLevel: "beginner",
        agreeToTerms: true,
      }),
    ).rejects.toThrow("do not match");
  });
});

describe("mockForgotPassword", () => {
  it("resolves without error for a valid email", async () => {
    await expect(mockForgotPassword("ada@bridgecoach.com")).resolves.toBeUndefined();
  });
});

describe("validation helpers", () => {
  it("validates email format", () => {
    expect(validateEmail("ada@bridgecoach.com")).toBeNull();
    expect(validateEmail("nope")).not.toBeNull();
  });

  it("validates password length", () => {
    expect(validatePassword("Password1")).toBeNull();
    expect(validatePassword("123")).not.toBeNull();
  });

  it("validates required fields", () => {
    expect(validateRequired("", "First name")).not.toBeNull();
    expect(validateRequired("Ada", "First name")).toBeNull();
  });
});
