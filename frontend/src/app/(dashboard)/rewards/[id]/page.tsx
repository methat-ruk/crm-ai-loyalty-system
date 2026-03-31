'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Gift, Pencil, Trash2, Star, TicketCheck, Users, AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RewardForm } from '@/components/Reward/RewardForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { rewardService, type RewardDetail } from '@/services/rewardService'
import { customerService } from '@/services/customerService'
import type { Customer, RedemptionStatus } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isExpired = (expiresAt: string | null) =>
  expiresAt ? new Date(expiresAt) < new Date() : false

const statusStyles: Record<RedemptionStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

// ─── Customer search (same pattern as loyalty page) ──────────────────────────

const CustomerSearch = ({
  value,
  onSelect,
  searchKey,
}: {
  value: Customer | null
  onSelect: (c: Customer | null) => void
  searchKey: number
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset when searchKey changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setQuery(''); setResults([]); setOpen(false) }, [searchKey])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (value) onSelect(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await customerService.getAll({ search: q, limit: 6 })
        setResults(res.data)
        setOpen(true)
      } catch { setResults([]) }
    }, 300)
  }

  const display = value ? `${value.firstName} ${value.lastName}` : query
  const hasInput = !!(value || query)

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Search customer…"
        value={display}
        onChange={handleChange}
        onFocus={() => { if (results.length) setOpen(true) }}
        className="text-sm pr-8"
      />
      {hasInput && (
        <button
          type="button"
          onMouseDown={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { onSelect(c); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0">
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{c.email}</p>
              </div>
              {c.loyaltyAccount && (
                <span className="text-xs font-semibold text-indigo-600 tabular-nums shrink-0">
                  {c.loyaltyAccount.totalPoints.toLocaleString()} pts
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Redeem panel ─────────────────────────────────────────────────────────────

const RedeemPanel = ({ reward, onSuccess }: { reward: RewardDetail; onSuccess: () => void }) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [searchKey, setSearchKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canRedeem = reward.isActive && !isExpired(reward.expiresAt) && (reward.stock === null || reward.stock > 0)

  const handleSelectCustomer = (c: Customer | null) => {
    setCustomer(c)
    setError('')
    setSuccess('')
  }

  const handleRedeem = async () => {
    if (!customer) { setError('Please select a customer'); return }
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await rewardService.redeem(reward.id, customer.id)
      setSuccess(`Redeemed "${reward.name}" for ${customer.firstName} ${customer.lastName}`)
      setCustomer(null)
      setSearchKey((k) => k + 1)
      onSuccess()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Something went wrong')
      } else {
        setError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">Redeem for Customer</h2>
      </div>
      <div className="p-5 space-y-3">
        {!canRedeem ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {!reward.isActive ? 'This reward is inactive' :
             isExpired(reward.expiresAt) ? 'This reward has expired' : 'Out of stock'}
          </div>
        ) : (
          <>
            <CustomerSearch value={customer} onSelect={handleSelectCustomer} searchKey={searchKey} />
            {customer && (
              <div className="flex items-center justify-between text-xs bg-indigo-50 rounded-lg px-3 py-2">
                <span className="text-slate-600">Balance</span>
                <span className={clsx(
                  'font-semibold tabular-nums',
                  (customer.loyaltyAccount?.totalPoints ?? 0) >= reward.pointsCost
                    ? 'text-emerald-600' : 'text-red-500',
                )}>
                  {(customer.loyaltyAccount?.totalPoints ?? 0).toLocaleString()} pts
                  {(customer.loyaltyAccount?.totalPoints ?? 0) < reward.pointsCost && ' (insufficient)'}
                </span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <TicketCheck className="w-3.5 h-3.5 shrink-0" />
                {success}
              </div>
            )}
            <div className="flex gap-2">
              {customer && (
                <Button
                  type="button"
                  onClick={() => { handleSelectCustomer(null); setSearchKey((k) => k + 1) }}
                  className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-600"
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={handleRedeem}
                disabled={loading || !customer}
                className="flex-1 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                  <><TicketCheck className="w-4 h-4" /> Redeem {reward.pointsCost.toLocaleString()} pts</>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Pagination controls ──────────────────────────────────────────────────────

const PageControls = ({
  page, totalPages, loading, onChange,
}: {
  page: number; totalPages: number; loading: boolean; onChange: (p: number) => void
}) => {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100">
      <span className="text-xs text-slate-400 tabular-nums">{page} / {totalPages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1 || loading}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages || loading}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [reward, setReward] = useState<RewardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Redemptions pagination
  const [rdPage, setRdPage] = useState(1)
  const [rdData, setRdData] = useState<RewardDetail['redemptions']>([])
  const [rdTotal, setRdTotal] = useState(0)
  const [rdTotalPages, setRdTotalPages] = useState(1)
  const [rdLoading, setRdLoading] = useState(false)

  const loadRedemptions = useCallback(async (p: number) => {
    setRdLoading(true)
    try {
      const res = await rewardService.getRedemptions(id, { page: p, limit: 10 })
      setRdData(res.data as RewardDetail['redemptions'])
      setRdTotal(res.total)
      setRdTotalPages(res.totalPages)
    } finally { setRdLoading(false) }
  }, [id])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await rewardService.getOne(id)
      setReward(data)
    } catch {
      router.push('/rewards')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadRedemptions(1) }, [loadRedemptions])

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await rewardService.remove(id)
      router.push('/rewards')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setDeleteError(err.response?.data?.message ?? 'Something went wrong')
      } else {
        setDeleteError('Something went wrong')
      }
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusUpdate = async (redemptionId: string, status: 'COMPLETED' | 'CANCELLED') => {
    setUpdatingStatus(redemptionId)
    try {
      await rewardService.updateRedemptionStatus(redemptionId, status)
      load()
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!reward) return null

  const expired = isExpired(reward.expiresAt)

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => rewardService.update(id, { isActive: !reward.isActive }).then(load)}
            className={clsx(
              'cursor-pointer',
              reward.isActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
            )}
          >
            {reward.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <div className="w-px h-6 bg-slate-200" />
          <Button
            onClick={() => setShowEdit(true)}
            className="gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          <Button
            onClick={() => setShowDelete(true)}
            className="gap-1.5 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Reward card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 flex-wrap">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 shrink-0">
          <Gift className="w-7 h-7 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-800">{reward.name}</h1>
            {!reward.isActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactive</span>
            )}
            {expired && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expired</span>
            )}
          </div>
          {reward.description && <p className="mt-0.5 text-sm text-slate-500">{reward.description}</p>}
          {reward.expiresAt && (
            <p className={clsx('text-xs mt-1', expired ? 'text-red-500' : 'text-slate-400')}>
              {expired ? 'Expired' : 'Expires'} {new Date(reward.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-6 shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Star className="w-4 h-4 text-indigo-500" />
              <p className="text-2xl font-bold text-indigo-600 tabular-nums">{reward.pointsCost.toLocaleString()}</p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Points Cost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-700 tabular-nums">
              {reward.stock !== null ? reward.stock.toLocaleString() : '∞'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Stock</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{rdTotal}</p>
            <p className="text-xs text-slate-400 mt-0.5">Redeemed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Redemption history */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Redemption History</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {rdTotal} total
            </div>
          </div>
          {rdLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : rdData.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No redemptions yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rdData.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                    {r.customer.firstName[0]}{r.customer.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {r.customer.firstName} {r.customer.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 tabular-nums shrink-0">
                    {r.pointsUsed.toLocaleString()} pts
                  </span>
                  <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0', statusStyles[r.status])}>
                    {r.status}
                  </span>
                  {r.status === 'PENDING' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStatusUpdate(r.id, 'COMPLETED')}
                        disabled={updatingStatus === r.id}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(r.id, 'CANCELLED')}
                        disabled={updatingStatus === r.id}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <PageControls page={rdPage} totalPages={rdTotalPages} loading={rdLoading} onChange={(p) => { setRdPage(p); loadRedemptions(p) }} />
        </div>

        {/* Redeem panel */}
        <RedeemPanel reward={reward} onSuccess={load} />
      </div>

      {showEdit && (
        <RewardForm
          reward={reward}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); load() }}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete Reward"
          description={`Delete "${reward.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => { setShowDelete(false); setDeleteError('') }}
          loading={deleting}
          error={deleteError}
        />
      )}
    </div>
  )
}
