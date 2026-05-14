'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export const AuthGate = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setReady(true)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (ready && !token) {
      router.replace('/login')
    }
  }, [ready, router, token])

  if (!ready || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Preparing your workspace...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
