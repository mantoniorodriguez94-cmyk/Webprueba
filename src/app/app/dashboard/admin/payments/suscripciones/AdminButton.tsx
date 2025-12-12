"use client"

interface AdminButtonProps {
  label: string
  actionTitle: string
  subscriptionId: string
  api: string
  extra?: any
  variant?: "default" | "danger" | "success"
}

export default function AdminButton({ 
  label, 
  actionTitle, 
  subscriptionId, 
  api, 
  extra = {}, 
  variant = "default" 
}: AdminButtonProps) {
  const color =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : variant === "success"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-800 hover:bg-gray-700"

  async function handleClick() {
    const body = {
      subscriptionId,
      ...extra,
    }

    const res = await fetch(api, {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      alert("Error procesando la acción")
      return
    }

    alert("Acción realizada con éxito")
    location.reload()
  }

  return (
    <button
      onClick={handleClick}
      title={actionTitle}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${color}`}
    >
      {label}
    </button>
  )
}

