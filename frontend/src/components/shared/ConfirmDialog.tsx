'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  confirmClass?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  error?: string
}

export const ConfirmDialog = ({
  title,
  description,
  confirmLabel = 'Delete',
  confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
  onConfirm,
  onCancel,
  loading = false,
  error,
}: ConfirmDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {error && (
        <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="text-slate-500 dark:text-slate-400 cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className={`${confirmClass} cursor-pointer`}
        >
          {loading ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </div>
  </div>
)
