'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, Tag, Calendar, Zap, Gift, Percent, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import promotionService, { type CampaignWithExpiry } from '@/services/promotionService'
import { PromotionForm } from '@/components/Promotion/PromotionForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { CampaignType } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<CampaignType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  POINTS_MULTIPLIER: { label: 'Points Multiplier', icon: Zap,     color: 'text-amber-600',   bg: 'bg-amber-50' },
  BONUS_POINTS:      { label: 'Bonus Points',      icon: Star,    color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  DISCOUNT:          { label: 'Discount',           icon: Percent, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  FREE_REWARD:       { label: 'Free Reward',        icon: Gift,    color: 'text-violet-600',  bg: 'bg-violet-50' },
}

const TYPE_BADGE: Record<CampaignType, string> = {
  POINTS_MULTIPLIER: 'bg-amber-100 text-amber-700',
  BONUS_POINTS:      'bg-indigo-100 text-indigo-700',
  DISCOUNT:          'bg-emerald-100 text-emerald-700',
  FREE_REWARD:       'bg-violet-100 text-violet-700',
}

const FILTER_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'POINTS_MULTIPLIER', label: 'Points Multiplier' },
  { value: 'BONUS_POINTS', label: 'Bonus Points' },
  { value: 'DISCOUNT', label: 'Discount' },
  { value: 'FREE_REWARD', label: 'Free Reward' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ c }: { c: CampaignWithExpiry }) => {
  if (c.isExpired)  return <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">Expired</span>
  if (!c.isActive)  return <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>
  return <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithExpiry[]>([])

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, expired: 0 })
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<CampaignWithExpiry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CampaignWithExpiry | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (q = search, type = typeFilter, status = statusFilter, p = page) => {
    setLoading(true)
    try {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined
      const res = await promotionService.getAll({ search: q || undefined, type: type || undefined, isActive, page: p, limit: 12 })
      setCampaigns(res.data)
      setTotalPages(res.totalPages)

      const all = await promotionService.getAll({ limit: 1000 })
      setStats({
        total: all.total,
        active: all.data.filter((c) => c.isActive && !c.isExpired).length,
        inactive: all.data.filter((c) => !c.isActive && !c.isExpired).length,
        expired: all.data.filter((c) => c.isExpired).length,
      })
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, page])

  useEffect(() => {
    setPage(1)
    void load(search, typeFilter, statusFilter, 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, statusFilter])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearch(q)
    setPage(1)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => void load(q, typeFilter, statusFilter, 1), 400)
  }

  const handleStatusChange = (s: typeof statusFilter) => {
    setStatusFilter(s)
    setPage(1)
    void load(search, typeFilter, s, 1)
  }

  const handleTypeChange = (t: string) => {
    setTypeFilter(t)
    setPage(1)
    void load(search, t, statusFilter, 1)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    void load(search, typeFilter, statusFilter, p)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await promotionService.remove(deleteTarget.id)
      setDeleteTarget(null)
      void load(search, typeFilter, statusFilter, page)
    } catch {
      setDeleteError('Failed to delete campaign')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggle = async (c: CampaignWithExpiry) => {
    await promotionService.toggle(c.id)
    void load(search, typeFilter, statusFilter, page)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Promotions</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Manage campaigns and promotions</p>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: stats.total,    icon: Tag,     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
          { label: 'Active',          value: stats.active,   icon: Zap,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive',        value: stats.inactive, icon: Gift,    color: 'text-slate-500',   bg: 'bg-slate-100' },
          { label: 'Expired',         value: stats.expired,  icon: Calendar,color: 'text-red-500',     bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className={clsx('flex items-center justify-center w-8 h-8 rounded-xl shrink-0', bg)}>
              <Icon className={clsx('w-4 h-4', color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tabular-nums">{value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search campaigns…"
            value={search}
            onChange={handleSearchChange}
            className="pl-8 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {FILTER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-medium">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={clsx(
                'px-3 py-1.5 transition-colors cursor-pointer capitalize',
                statusFilter === s && s === 'all'      && 'bg-indigo-500 text-white',
                statusFilter === s && s === 'active'   && 'bg-emerald-200 text-emerald-700',
                statusFilter === s && s === 'inactive' && 'bg-slate-200 text-slate-600',
                statusFilter !== s && 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-16 text-center">
          <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No campaigns found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const meta = TYPE_META[c.type]
            const Icon = meta.icon
            return (
              <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={clsx('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', meta.bg)}>
                      <Icon className={clsx('w-5 h-5', meta.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                      <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full', TYPE_BADGE[c.type])}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <StatusBadge c={c} />
                </div>

                {/* Value */}
                {(c.type === 'POINTS_MULTIPLIER' && c.pointsMultiplier) && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{c.pointsMultiplier}x points multiplier</p>
                )}
                {(c.type === 'BONUS_POINTS' && c.bonusPoints) && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">+{c.bonusPoints.toLocaleString()} bonus points</p>
                )}

                {/* Description */}
                {c.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{c.description}</p>
                )}

                {/* Date range */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {formatDate(c.startDate)} — {formatDate(c.endDate)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-auto">
                  <button
                    onClick={() => handleToggle(c)}
                    disabled={c.isExpired}
                    className={clsx(
                      'text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white',
                      c.isActive
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-emerald-600 hover:bg-emerald-700',
                    )}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="flex items-center">
                    <button
                      onClick={() => { setEditTarget(c); setShowForm(true) }}
                      className="text-xs px-2.5 py-1 rounded-lg text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300 dark:text-slate-600 select-none">|</span>
                    <button
                      onClick={() => { setDeleteError(''); setDeleteTarget(c) }}
                      className="text-xs px-2.5 py-1 rounded-lg text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300 tabular-nums">{page} / {totalPages}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PromotionForm
          campaign={editTarget ?? undefined}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSuccess={() => { setShowForm(false); setEditTarget(null); void load(search, typeFilter, statusFilter, page) }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Campaign"
          description={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  )
}
