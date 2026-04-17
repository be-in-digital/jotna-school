/**
 * Client-side auth utilities for Convex Auth with email/password.
 *
 * These functions wrap the Convex Auth signIn/signOut actions
 * for use in React components via useAuthActions().
 *
 * Usage (inside a component rendered within ConvexAuthNextjsProvider):
 *
 *   import { useAuthActions } from "@convex-dev/auth/react";
 *   import { register, login, logout } from "@/lib/auth";
 *
 *   const { signIn, signOut } = useAuthActions();
 *   await register(signIn, { email, password, name, role: "student" });
 *   await login(signIn, { email, password });
 *   await logout(signOut);
 */

type SignIn = (
  provider: string,
  params?: Record<string, unknown>,
) => Promise<{ signingIn: boolean }>;

type SignOut = () => Promise<void>;

// ── Registration ────────────────────────────────────────────────────────────

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  role: "parent" | "student" | "professeur";
}

/**
 * Register a new user with email and password.
 * A profile row (with the given role) is created automatically on the backend.
 */
export async function register(
  signIn: SignIn,
  params: RegisterParams,
): Promise<{ signingIn: boolean }> {
  return signIn("password", {
    flow: "signUp",
    email: params.email,
    password: params.password,
    name: params.name,
    role: params.role,
  });
}

// ── Login ───────────────────────────────────────────────────────────────────

export interface LoginParams {
  email: string;
  password: string;
}

/**
 * Sign in an existing user with email and password.
 */
export async function login(
  signIn: SignIn,
  params: LoginParams,
): Promise<{ signingIn: boolean }> {
  return signIn("password", {
    flow: "signIn",
    email: params.email,
    password: params.password,
  });
}

// ── Logout ──────────────────────────────────────────────────────────────────

/**
 * Sign out the current user (invalidates the session).
 */
export async function logout(signOut: SignOut): Promise<void> {
  return signOut();
}
