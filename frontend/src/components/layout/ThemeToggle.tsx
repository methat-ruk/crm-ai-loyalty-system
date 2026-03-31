'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="text-xs font-medium hidden sm:inline">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}
