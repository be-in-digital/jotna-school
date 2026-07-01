import { redirect } from "next/navigation";

// Redesign Gaming G1 — Pio vit au camp (hub) : la page mascotte dédiée est
// absorbée par /student/home. Redirect conservé pour les liens existants.
export default function LegacyMascottePage() {
  redirect("/student/home");
}
