import { redirect } from "next/navigation";

// Redesign Gaming §3 — l'ancienne page matière vit désormais sur la carte.
// Redirect conservé pour les liens/bookmarks existants.
export default async function LegacySubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/student/map/${id}`);
}
