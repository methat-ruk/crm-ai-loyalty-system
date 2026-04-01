'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import promotionService from '@/services/promotionService'
import type { Campaign, CampaignType, CreateCampaignPayload } from '@/types'

interface PromotionFormProps {
  campaign?: Campaign
  onClose: () => void
  onSuccess: () => void
}

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: 'POINTS_MULTIPLIER', label: 'Points Multiplier' },
  { value: 'BONUS_POINTS', label: 'Bonus Points' },
  { value: 'DISCOUNT', label: 'Discount' },
  { value: 'FREE_REWARD', label: 'Free Reward' },
]

interface FieldErrors {
  name?: string
  type?: string
  pointsMultiplier?: string
  bonusPoints?: string
  startDate?: string
  endDate?: string
}

export const PromotionForm = ({ campaign, onClose, onSuccess }: PromotionFormProps) => {
  const isEdit = !!campaign

  const [name, setName] = useState(campaign?.name ?? '')
  const [description, setDescription] = useState(campaign?.description ?? '')
  const [type, setType] = useState<CampaignType>(campaign?.type ?? 'BONUS_POINTS')
  const [pointsMultiplier, setPointsMultiplier] = useState(
    campaign?.pointsMultiplier != null ? String(campaign.pointsMultiplier) : '',
  )
  const [bonusPoints, setBonusPoints] = useState(
    campaign?.bonusPoints != null ? String(campaign.bonusPoints) : '',
  )
  const [startDate, setStartDate] = useState(
    campaign?.startDate ? campaign.startDate.slice(0, 10) : '',
  )
  const [endDate, setEndDate] = useState(
    campaign?.endDate ? campaign.endDate.slice(0, 10) : '',
  )
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!startDate) errors.startDate = 'Start date is required'
    if (!endDate) errors.endDate = 'End date is required'
    if (startDate && endDate && endDate < startDate)
      errors.endDate = 'End date must be after start date'
    if (type === 'POINTS_MULTIPLIER') {
      if (!pointsMultiplier || isNaN(Number(pointsMultiplier)) || Number(pointsMultiplier) <= 0)
        errors.pointsMultiplier = 'Multiplier must be a positive number'
    }
    if (type === 'BONUS_POINTS') {
      if (!bonusPoints || isNaN(Number(bonusPoints)) || Number(bonusPoints) <= 0)
        errors.bonusPoints = 'Bonus points must be a positive integer'
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setLoading(true)

    try {
      const payload: CreateCampaignPayload = {
        name,
        description: description || undefined,
        type,
        startDate,
        endDate,
        ...(type === 'POINTS_MULTIPLIER' && { pointsMultiplier: Number(pointsMultiplier) }),
        ...(type === 'BONUS_POINTS' && { bonusPoints: Number(bonusPoints) }),
      }
      if (isEdit) {
        await promotionService.update(campaign.id, payload)
      } else {
        await promotionService.create(payload)
      }
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.message
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg)
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const err = (f: keyof FieldErrors) => fieldErrors[f]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Edit Campaign' : 'Add Campaign'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Double Points"
              className={clsx('text-sm', err('name') && 'border-red-400 focus-visible:ring-red-300')}
            />
            {err('name') && <p className="text-xs text-red-500">{err('name')}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="text-sm"
            />
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Type *</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as CampaignType); setFieldErrors({}) }}
                className="w-full appearance-none text-sm h-9 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 dark:text-slate-300 pointer-events-none" />
            </div>
          </div>

          {/* Conditional fields */}
          {type === 'POINTS_MULTIPLIER' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Points Multiplier *</label>
              <Input
                type="number"
                value={pointsMultiplier}
                onChange={(e) => setPointsMultiplier(e.target.value)}
                placeholder="e.g. 2 (for 2x points)"
                step="0.1"
                min="0.1"
                className={clsx('text-sm', err('pointsMultiplier') && 'border-red-400 focus-visible:ring-red-300')}
              />
              {err('pointsMultiplier') && <p className="text-xs text-red-500">{err('pointsMultiplier')}</p>}
            </div>
          )}
          {type === 'BONUS_POINTS' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Bonus Points *</label>
              <Input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
                placeholder="e.g. 500"
                min="1"
                className={clsx('text-sm', err('bonusPoints') && 'border-red-400 focus-visible:ring-red-300')}
              />
              {err('bonusPoints') && <p className="text-xs text-red-500">{err('bonusPoints')}</p>}
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Start Date *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={clsx('text-sm', err('startDate') && 'border-red-400 focus-visible:ring-red-300')}
              />
              {err('startDate') && <p className="text-xs text-red-500">{err('startDate')}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">End Date *</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setFieldErrors((prev) => ({ ...prev, endDate: undefined })) }}
                className={clsx('text-sm', err('endDate') && 'border-red-400 focus-visible:ring-red-300')}
              />
              {err('endDate') && <p className="text-xs text-red-500">{err('endDate')}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
