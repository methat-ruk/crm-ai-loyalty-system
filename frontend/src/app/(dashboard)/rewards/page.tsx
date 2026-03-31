'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Star, Gift, TicketCheck, ChevronLeft, ChevronRight, PackageX } from 'lucide-react'
import { clsx } from 'clsx'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RewardForm } from '@/components/Reward/RewardForm'
import { rewardService, type RewardWithCount } from '@/services/rewardService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isExpired = (expiresAt: string | null) =>
  expiresAt ? new Date(expiresAt) < new Date() : false

const isLowStock = (stock: number | null) => stock !== null && stock <= 5

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, redemptions: 0 })
  const [showForm, setShowForm] = useState(false)

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (q = search, status = statusFilter, p = page) => {
    setLoading(true)
    try {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined
      const res = await rewardService.getAll({ search: q || undefined, isActive, page: p, limit: 12 })
      setRewards(res.data)
      setTotalPages(res.totalPages)
      setStats({ total: res.total, active: res.activeCount, inactive: res.inactiveCount, redemptions: res.totalRedemptions })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearch(q)
    setPage(1)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => load(q, statusFilter, 1), 400)
  }

  const handleStatusChange = (s: typeof statusFilter) => {
    setStatusFilter(s)
    setPage(1)
    load(search, s, 1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Rewards</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Manage reward catalog and redemptions</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Reward
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Rewards', value: stats.total, icon: Gift, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: stats.active, icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: stats.inactive, icon: PackageX, color: 'text-slate-500', bg: 'bg-slate-100' },
          { label: 'Total Redemptions', value: stats.redemptions, icon: TicketCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
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
            placeholder="Search rewards…"
            value={search}
            onChange={handleSearchChange}
            className="pl-8 text-sm"
          />
        </div>
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-medium">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={clsx(
                'px-3 py-1.5 transition-colors cursor-pointer capitalize',
                statusFilter === s && s === 'all' && 'bg-indigo-500 text-white',
                statusFilter === s && s === 'active' && 'bg-emerald-200 text-emerald-700',
                statusFilter === s && s === 'inactive' && 'bg-slate-200 text-slate-600',
                statusFilter !== s && 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-16 text-center">
          <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No rewards found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const expired = isExpired(reward.expiresAt)
            const lowStock = isLowStock(reward.stock)
            return (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all flex flex-col gap-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 shrink-0">
                    <Gift className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {!reward.isActive && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Inactive
                      </span>
                    )}
                    {expired && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                        Expired
                      </span>
                    )}
                    {lowStock && !expired && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{reward.name}</p>
                  {reward.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">{reward.description}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <Star className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold tabular-nums">{reward.pointsCost.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">pts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    {reward.stock !== null ? (
                      <span className={clsx('font-medium', lowStock ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400')}>
                        {reward.stock} left
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Unlimited</span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400">{reward._count.redemptions} redeemed</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => { setPage((p) => p - 1); load(search, statusFilter, page - 1) }}
            disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => { setPage((p) => p + 1); load(search, statusFilter, page + 1) }}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <RewardForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
