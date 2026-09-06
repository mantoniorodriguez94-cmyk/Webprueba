// Consolidated into the unified inbox at /app/dashboard/chat
import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function MensajesNegocioPage({ params }: Props) {
  const { id } = await params
  redirect(`/app/dashboard/chat?tab=negocio&business=${id}`)
}
