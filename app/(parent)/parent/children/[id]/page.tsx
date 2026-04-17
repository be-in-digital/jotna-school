import { redirect } from "next/navigation";

export default async function ChildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/parent/children/${id}/progress`);
}
