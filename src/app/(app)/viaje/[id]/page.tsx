import { redirect } from "next/navigation";

export default async function ViajeIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/viaje/${id}/chat`);
}
