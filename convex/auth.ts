import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: (params.email as string) ?? "",
          name: (params.name as string) ?? "",
          // Pass role through so createOrUpdateUser can read it.
          // This field is NOT stored on the users table -- we strip it
          // out in createOrUpdateUser and store it on the profiles table.
          role: (params.role as string) ?? "student",
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      // --- Existing user (sign-in): just return the id ---
      if (existingUserId !== null) {
        return existingUserId;
      }

      // --- New user (sign-up): create user + profile ---
      const rawRole = (profile as Record<string, unknown>).role as
        | string
        | undefined;

      // Never allow self-registration as "admin": reserved for site owner
      // (created manually or via seed).
      if (rawRole === "admin") {
        throw new Error("Rôle non autorisé");
      }

      const allowedRoles = ["parent", "student", "professeur"] as const;
      const role = (allowedRoles as readonly string[]).includes(rawRole ?? "")
        ? (rawRole as "parent" | "student" | "professeur")
        : "student";

      const name = (profile.name as string) ?? "";
      const email = (profile.email as string) ?? undefined;

      const userId = await ctx.db.insert("users", {
        name,
        email,
      });

      await ctx.db.insert("profiles", {
        userId: userId,
        role,
        name,
      });

      return userId;
    },
  },
});
