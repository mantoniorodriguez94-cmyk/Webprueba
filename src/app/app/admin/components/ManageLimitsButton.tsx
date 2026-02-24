"use client"

import { useState } from "react"
import ManageLimitsModal from "./ManageLimitsModal"

type Props = {
  profileId: string
  profileName?: string
  businessId?: string
  businessName?: string
}

export default function ManageLimitsButton({
  profileId,
  profileName = "Usuario",
  businessId,
  businessName,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 text-xs font-medium"
      >
        Límites y tier
      </button>
      <ManageLimitsModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => window.location.reload()}
        profileId={profileId}
        profileName={profileName}
        businessId={businessId}
        businessName={businessName}
      />
    </>
  )
}
