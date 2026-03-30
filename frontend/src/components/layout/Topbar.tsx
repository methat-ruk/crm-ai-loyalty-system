'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Menu, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onMenuClick: () => void
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const segmentLabel: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  rewards: 'Rewards',
  loyalty: 'Loyalty',
  analytics: 'Analytics',
  'ai-insights': 'AI Insights',
}

const isId = (segment: string) =>
  /^[a-z0-9]{20,}$/i.test(segment) || segment.length > 20

const segmentDisplayLabel = (segment: string): string =>
  segmentLabel[segment] ?? (isId(segment) ? 'Profile' : segment)

const useBreadcrumbs = () => {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return segments.map((seg, i) => ({
    label: segmentDisplayLabel(seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const breadcrumbs = useBreadcrumbs()

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
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — always visible */}
        <button
          onClick={onMenuClick}
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 min-w-0">
          {breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-1 min-w-0">
              {crumb.isLast ? (
                <span className="text-sm font-medium text-slate-800 truncate">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right side: user info + divider + logout */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="leading-tight hidden sm:block">
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
