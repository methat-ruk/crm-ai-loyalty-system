'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerForm } from '@/components/Customer/CustomerForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { customerService } from '@/services/customerService'
import type { Customer, Tier } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIERS: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

const tierStyles: Record<Tier, string> = {
  PLATINUM: 'bg-violet-100 text-violet-700',
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-slate-100 text-slate-600',
  BRONZE: 'bg-orange-100 text-orange-700',
}

const tierActive: Record<Tier, string> = {
  PLATINUM: 'bg-violet-600 text-white',
  GOLD: 'bg-amber-500 text-white',
  SILVER: 'bg-slate-500 text-white',
  BRONZE: 'bg-orange-500 text-white',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTiers, setSelectedTiers] = useState<Tier[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [pointsMin, setPointsMin] = useState('')
  const [pointsMax, setPointsMax] = useState('')
  const [pointsMinDebounced, setPointsMinDebounced] = useState('')
  const [pointsMaxDebounced, setPointsMaxDebounced] = useState('')
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>()
  const [deleting, setDeleting] = useState(false)

  const limit = 20

  const isActiveParam =
    statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined

  const hasFilter =
    selectedTiers.length > 0 ||
    statusFilter !== 'all' ||
    pointsMin !== '' ||
    pointsMax !== ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await customerService.getAll({
        search: query || undefined,
        page,
        limit,
        tiers: selectedTiers.length ? selectedTiers : undefined,
        isActive: isActiveParam,
        pointsMin: pointsMinDebounced ? Number(pointsMinDebounced) : undefined,
        pointsMax: pointsMaxDebounced ? Number(pointsMaxDebounced) : undefined,
      })
      setCustomers(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
      setActiveCount(res.activeCount)
      setInactiveCount(res.inactiveCount)
    } catch {
      // keep previous data
    } finally {
      setLoading(false)
    }
  }, [query, page, selectedTiers, isActiveParam, pointsMinDebounced, pointsMaxDebounced])

  useEffect(() => { load() }, [load])

  // debounce search → query
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  // debounce points range
  useEffect(() => {
    const t = setTimeout(() => { setPointsMinDebounced(pointsMin); setPage(1) }, 600)
    return () => clearTimeout(t)
  }, [pointsMin])

  useEffect(() => {
    const t = setTimeout(() => { setPointsMaxDebounced(pointsMax); setPage(1) }, 600)
    return () => clearTimeout(t)
  }, [pointsMax])

  const toggleTier = (tier: Tier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier],
    )
    setPage(1)
  }

  const resetFilters = () => {
    setSelectedTiers([])
    setStatusFilter('all')
    setPointsMin('')
    setPointsMax('')
    setPointsMinDebounced('')
    setPointsMaxDebounced('')
    setPage(1)
  }

  const openCreate = () => { setEditTarget(undefined); setShowForm(true) }
  const openEdit = (c: Customer) => { setEditTarget(c); setShowForm(true) }
  const closeForm = () => setShowForm(false)
  const handleSuccess = () => { closeForm(); load() }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await customerService.remove(deleteTarget.id)
      setDeleteTarget(undefined)
      load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Customers</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total.toLocaleString()} customer{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Tier */}
          <div className="space-y-1.5 w-full sm:w-auto shrink-0">
            <p className="text-xs font-medium text-slate-500">Tier</p>
            <div className="flex items-center gap-1.5">
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={clsx(
                    'flex-1 sm:flex-none text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer',
                    selectedTiers.includes(tier) ? tierActive[tier] : tierStyles[tier],
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5 w-full sm:w-auto shrink-0">
            <p className="text-xs font-medium text-slate-500">Status</p>
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={clsx(
                    'flex-1 sm:flex-none px-3 py-1.5 transition-colors cursor-pointer capitalize',
                    statusFilter === s && s === 'all' && 'bg-indigo-500 text-white',
                    statusFilter === s && s === 'active' && 'bg-emerald-200 text-emerald-700',
                    statusFilter === s && s === 'inactive' && 'bg-slate-200 slate-500',
                    statusFilter !== s && 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Points Range */}
          <div className="space-y-1.5 w-full sm:w-auto shrink-0">
            <p className="text-xs font-medium text-slate-500">Points Range</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={pointsMin}
                onChange={(e) => setPointsMin(e.target.value)}
                className="flex-1 sm:w-28 sm:flex-none text-xs"
              />
              <span className="text-slate-400 text-xs shrink-0">–</span>
              <Input
                type="number"
                placeholder="Max"
                value={pointsMax}
                onChange={(e) => setPointsMax(e.target.value)}
                className="flex-1 sm:w-28 sm:flex-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Reset — full-width row below filters */}
        {hasFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Reset filters
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tier</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Points</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/customers/${c.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-800">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{c.email}</td>
                    <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', tierStyles[c.tier])}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 tabular-nums hidden sm:table-cell">
                      {c.loyaltyAccount?.totalPoints.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                      )}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats + Pagination */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 bg-slate-50 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">Total <span className="font-semibold text-slate-700">{total}</span></span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="text-xs text-emerald-600">Active <span className="font-semibold">{activeCount}</span></span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="text-xs text-slate-500">Inactive <span className="font-semibold">{inactiveCount}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <CustomerForm customer={editTarget} onClose={closeForm} onSuccess={handleSuccess} />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Customer"
          description={`Are you sure you want to delete "${deleteTarget.firstName} ${deleteTarget.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(undefined)}
          loading={deleting}
        />
      )}
    </div>
  )
}
