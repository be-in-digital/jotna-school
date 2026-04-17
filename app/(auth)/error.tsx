"use client";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="text-center p-4">
      <h2 className="text-lg font-semibold mb-2">Erreur</h2>
      <button onClick={reset} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
        Réessayer
      </button>
    </div>
  );
}
