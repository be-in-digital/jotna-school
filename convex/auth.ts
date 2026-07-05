import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { currentSchoolYear, isClassLevel } from "./classes";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const rawEmail = (params.email as string) ?? "";
        return {
          email: rawEmail.trim().toLowerCase(),
          name: (params.name as string) ?? "",
          // Pass role + studentClass through so createOrUpdateUser can read
          // them. These fields are NOT stored on the users table -- we strip
          // them out in createOrUpdateUser and store them on profiles.
          role: (params.role as string) ?? "student",
          studentClass: (params.studentClass as string) ?? "",
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
      },
      reset: ResendOTPPasswordReset,
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

      // Classe déclarée à l'inscription (élèves uniquement). Invalide ou
      // absente → profil sans classe ; le ClassGate élève la demandera.
      const rawClass = (profile as Record<string, unknown>).studentClass;
      const studentClass =
        role === "student" && isClassLevel(rawClass) ? rawClass : undefined;

      await ctx.db.insert("profiles", {
        userId: userId,
        role,
        name,
        ...(studentClass !== undefined
          ? { class: studentClass, classSchoolYear: currentSchoolYear() }
          : {}),
      });

      return userId;
    },
  },
});
