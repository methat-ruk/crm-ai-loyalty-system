'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onMenuClick: () => void
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
    router.push('/login')
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-6 h-14 bg-white shadow-sm border-b border-slate-100 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      {/* Right side: user info + divider + logout */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-200" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-800 hover:bg-transparent cursor-pointer gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </header>
  )
}
