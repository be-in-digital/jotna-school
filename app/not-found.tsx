import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Cette page est introuvable</p>
        <Link
          href="/"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
