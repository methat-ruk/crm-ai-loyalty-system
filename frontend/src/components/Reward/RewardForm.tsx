'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { rewardService } from '@/services/rewardService'
import type { Reward } from '@/types'

interface RewardFormProps {
  reward?: Reward
  onClose: () => void
  onSuccess: () => void
}

interface FieldErrors {
  name?: string
  pointsCost?: string
  stock?: string
  expiresAt?: string
}

export const RewardForm = ({ reward, onClose, onSuccess }: RewardFormProps) => {
  const isEdit = !!reward

  const [name, setName] = useState(reward?.name ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [pointsCost, setPointsCost] = useState(String(reward?.pointsCost ?? ''))
  const [stock, setStock] = useState(reward?.stock != null ? String(reward.stock) : '')
  const [expiresAt, setExpiresAt] = useState(
    reward?.expiresAt ? new Date(reward.expiresAt).toISOString().slice(0, 10) : '',
  )
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!pointsCost || isNaN(Number(pointsCost)) || Number(pointsCost) <= 0)
      errors.pointsCost = 'Points cost must be a positive number'
    if (stock && (isNaN(Number(stock)) || Number(stock) < 0))
      errors.stock = 'Stock must be 0 or more'
    if (expiresAt && isNaN(Date.parse(expiresAt)))
      errors.expiresAt = 'Invalid date'
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})
    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        pointsCost: Number(pointsCost),
        stock: stock !== '' ? Number(stock) : undefined,
        expiresAt: expiresAt || undefined,
      }
      if (isEdit) {
        await rewardService.update(reward.id, payload)
      } else {
        await rewardService.create(payload)
      }
      onSuccess()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data
        if (Array.isArray(data?.errors)) {
          const mapped: FieldErrors = {}
          for (const e of data.errors) {
            const field = e.path?.[0] as keyof FieldErrors
            if (field) mapped[field] = e.message
          }
          setFieldErrors(mapped)
        } else {
          setGlobalError(data?.message ?? 'Something went wrong')
        }
      } else {
        setGlobalError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Edit Reward' : 'Add Reward'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Free Coffee"
              className={clsx('text-sm', fieldErrors.name && 'border-red-400 focus-visible:ring-red-300')}
            />
            {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="text-sm"
            />
          </div>

          {/* Points cost + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Points Cost *</label>
              <Input
                type="number"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
                placeholder="e.g. 500"
                min={1}
                className={clsx('text-sm', fieldErrors.pointsCost && 'border-red-400 focus-visible:ring-red-300')}
              />
              {fieldErrors.pointsCost && <p className="text-xs text-red-500">{fieldErrors.pointsCost}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Stock <span className="text-slate-400">(blank = unlimited)</span></label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="unlimited"
                min={0}
                className={clsx('text-sm', fieldErrors.stock && 'border-red-400 focus-visible:ring-red-300')}
              />
              {fieldErrors.stock && <p className="text-xs text-red-500">{fieldErrors.stock}</p>}
            </div>
          </div>

          {/* Expires at */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Expires On <span className="text-slate-400">(optional)</span></label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={clsx('text-sm', fieldErrors.expiresAt && 'border-red-400 focus-visible:ring-red-300')}
            />
            {fieldErrors.expiresAt && <p className="text-xs text-red-500">{fieldErrors.expiresAt}</p>}
          </div>

          {globalError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {globalError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={onClose} className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Reward'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
