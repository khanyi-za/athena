'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Legacy route — password reset now happens entirely on /auth/forgot-password
// (email → 6-digit code → new password). Old emailed links land here; send
// them to the start of the code flow.
export default function ResetPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/forgot-password')
  }, [router])

  return (
    <div className="flex justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand" />
    </div>
  )
}
