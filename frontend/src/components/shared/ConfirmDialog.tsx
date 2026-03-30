'use client'

import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  confirmClass?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export const ConfirmDialog = ({
  title,
  description,
  confirmLabel = 'Delete',
  confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="text-slate-500 cursor-pointer"
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
