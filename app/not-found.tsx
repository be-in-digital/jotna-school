import Link from "next/link";

import { Brand } from "@/components/landing/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-lime-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand size="lg" priority className="mx-auto origin-center" />
          <p className="mt-2 text-sm text-gray-500">Apprends en t&apos;amusant</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <p className="text-7xl font-bold tracking-tight text-amber-600">
            404
          </p>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Cette page a pris la récré
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            La page que tu cherches est introuvable. Elle a peut-être été
            déplacée ou n&apos;existe plus.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full rounded-lg bg-gray-900 py-2.5 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-amber-700 hover:underline"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
