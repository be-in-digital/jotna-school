import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Jotna School</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Apprends en t&apos;amusant
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
