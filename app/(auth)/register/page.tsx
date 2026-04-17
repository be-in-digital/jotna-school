"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"parent" | "student" | "professeur">(
    "parent",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, name, role, flow: "signUp" });
      const dest =
        role === "student"
          ? "/student/home"
          : "/parent/dashboard";
      router.push(dest);
    } catch {
      setError("Impossible de créer le compte. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center mb-2">Créer un compte</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rôle</label>
        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "parent" | "student" | "professeur")
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="parent">Parent / Tuteur</option>
          <option value="student">Élève</option>
          <option value="professeur">Professeur</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer un compte"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
