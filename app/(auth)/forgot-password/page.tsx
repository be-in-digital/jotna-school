"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("flow", "reset");
      await signIn("password", formData);
      router.replace(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError(
        "Impossible d'envoyer le code. Vérifiez votre adresse email et réessayez.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center mb-2">
        Mot de passe oublié
      </h1>
      <p className="text-center text-sm text-gray-600 mb-2">
        Saisissez votre email pour recevoir un code de réinitialisation.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Envoi..." : "Envoyer le code"}
      </button>

      <p className="text-center text-sm text-gray-600">
        <Link
          href="/login"
          className="font-medium text-amber-700 hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
