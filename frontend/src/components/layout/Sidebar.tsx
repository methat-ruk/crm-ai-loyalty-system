'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Star,
  Gift,
  BarChart2,
  Sparkles,
} from 'lucide-react'
import { clsx } from 'clsx'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Loyalty', href: '/loyalty', icon: Star },
  { label: 'Rewards', href: '/rewards', icon: Gift },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'AI Insights', href: '/ai-insights', icon: Sparkles },
]

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname()

  return (
    <aside
      className={clsx(
        'flex flex-col w-60 h-screen bg-slate-900 shrink-0 z-50',
        'fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 px-5 h-14 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">CRM AI</p>
            <p className="text-xs text-slate-400">Loyalty System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-white' : 'text-slate-500',
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700/60 shrink-0">
        <p className="text-xs text-slate-500 text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
