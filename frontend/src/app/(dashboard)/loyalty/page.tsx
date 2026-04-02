'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Star, TrendingUp, Users, RefreshCw, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loyaltyService, type LoyaltyOverview, type GlobalTransaction } from '@/services/loyaltyService'
import { customerService } from '@/services/customerService'
import { useRole } from '@/hooks/useRole'
import type { Customer, TransactionType } from '@/types'

// ─── Tier styles ──────────────────────────────────────────────────────────────

const tierStyles = {
  PLATINUM: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  GOLD: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  SILVER: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' },
  BRONZE: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
} as const

const txTypeStyles: Record<TransactionType, string> = {
  EARN: 'bg-emerald-100 text-emerald-700',
  REDEEM: 'bg-red-100 text-red-600',
  EXPIRE: 'bg-slate-100 text-slate-500',
  ADJUST: 'bg-indigo-100 text-indigo-700',
}

// ─── Customer search ──────────────────────────────────────────────────────────

const CustomerSearch = ({
  value,
  onSelect,
}: {
  value: Customer | null
  onSelect: (c: Customer | null) => void
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await customerService.getAll({ search: q, limit: 6 })
        setResults(res.data)
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 300)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (value) onSelect(null)
    search(e.target.value)
  }

  const handleSelect = (c: Customer) => {
    onSelect(c)
    setQuery(`${c.firstName} ${c.lastName}`)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Search customer name or email…"
        value={value ? `${value.firstName} ${value.lastName}` : query}
        onChange={handleChange}
        onFocus={() => { if (results.length) setOpen(true) }}
        className="text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0">
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.email}</p>
              </div>
              <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0', tierStyles[c.tier].badge)}>
                {c.tier}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Quick action form ────────────────────────────────────────────────────────

type ActionTab = 'earn' | 'redeem'

const QuickAction = ({ onSuccess }: { onSuccess: () => void }) => {
  const [tab, setTab] = useState<ActionTab>('earn')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [points, setPoints] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchKey, setSearchKey] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<{ points?: string; description?: string }>({})

  const reset = () => {
    setCustomer(null)
    setPoints('')
    setDescription('')
    setFieldErrors({})
    setSearchKey((k) => k + 1)
  }

  const handleTabChange = (t: ActionTab) => {
    setTab(t)
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: { points?: string; description?: string } = {}
    if (!customer) { toast.error('Please select a customer'); return }
    const pts = parseInt(points)
    if (!pts || pts <= 0) errors.points = 'Must be a positive number'
    if (!description.trim()) errors.description = 'Required'
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

    setLoading(true)
    try {
      const payload = { customerId: customer.id, points: pts, description: description.trim() }
      const result = tab === 'earn'
        ? await loyaltyService.earn(payload)
        : await loyaltyService.redeem(payload)
      setPoints('')
      setDescription('')
      onSuccess()
      // Refresh customer balance shown in the chip
      const updated = await customerService.getOne(customer.id)
      setCustomer((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tier: updated.tier,
          loyaltyAccount: prev.loyaltyAccount
            ? { ...prev.loyaltyAccount, totalPoints: updated.loyaltyAccount?.totalPoints ?? 0 }
            : prev.loyaltyAccount,
        }
      })
      if (tab === 'earn' && result.tierChanged) {
        toast.success(`${result.message} · Tier upgraded to ${result.tier}!`)
      } else {
        toast.success(result.message)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? 'Something went wrong')
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Action</h2>
        {/* Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => handleTabChange('earn')}
            className={clsx(
              'px-3 py-1.5 transition-colors cursor-pointer',
              tab === 'earn' ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50',
            )}
          >
            + Earn
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('redeem')}
            className={clsx(
              'px-3 py-1.5 transition-colors cursor-pointer',
              tab === 'redeem' ? 'bg-red-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50',
            )}
          >
            − Redeem
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Customer</label>
          <CustomerSearch key={searchKey} value={customer} onSelect={setCustomer} />
          {customer && (
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', tierStyles[customer.tier].badge)}>
                {customer.tier}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Balance:{' '}
                <span className="font-semibold text-indigo-600 tabular-nums">
                  {(customer.loyaltyAccount?.totalPoints ?? 0).toLocaleString()} pts
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Points</label>
          <Input
            type="number"
            placeholder="e.g. 100"
            value={points}
            onChange={(e) => { setPoints(e.target.value); setFieldErrors((p) => ({ ...p, points: undefined })) }}
            min={1}
            className={clsx('text-sm', fieldErrors.points && 'border-red-400 focus-visible:ring-red-200')}
          />
          {fieldErrors.points && <p className="text-xs text-red-500">{fieldErrors.points}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
          <Input
            placeholder={tab === 'earn' ? 'e.g. Purchase #1234' : 'e.g. Redeem for coffee'}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setFieldErrors((p) => ({ ...p, description: undefined })) }}
            className={clsx('text-sm', fieldErrors.description && 'border-red-400 focus-visible:ring-red-200')}
          />
          {fieldErrors.description && <p className="text-xs text-red-500">{fieldErrors.description}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            onClick={reset}
            className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
          >
            Clear
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={clsx(
              'flex-1 cursor-pointer text-white',
              tab === 'earn'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700',
            )}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : tab === 'earn' ? (
              <><Plus className="w-4 h-4" /> Earn Points</>
            ) : (
              <><Minus className="w-4 h-4" /> Redeem Points</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const { can } = useRole()
  const [overview, setOverview] = useState<LoyaltyOverview | null>(null)
  const [loading, setLoading] = useState(true)

  // Transactions pagination
  const [txPage, setTxPage] = useState(1)
  const [txData, setTxData] = useState<GlobalTransaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txLoading, setTxLoading] = useState(false)

  const loadTransactions = useCallback(async (p: number) => {
    setTxLoading(true)
    try {
      const res = await loyaltyService.getAllTransactions({ page: p, limit: 15 })
      setTxData(res.data)
      setTxTotal(res.total)
      setTxTotalPages(res.totalPages)
    } finally {
      setTxLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const data = await loyaltyService.getOverview()
      setOverview(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadTransactions(1) }, [loadTransactions])

  const totalTierCustomers =
    (overview?.tierCounts.BRONZE ?? 0) +
    (overview?.tierCounts.SILVER ?? 0) +
    (overview?.tierCounts.GOLD ?? 0) +
    (overview?.tierCounts.PLATINUM ?? 0)

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Loyalty</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Points overview and quick actions</p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Loyalty Members', value: overview?.totalAccounts.toLocaleString() ?? '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Points in Circulation', value: overview?.totalPoints.toLocaleString() ?? '0', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Lifetime Points', value: overview?.totalLifetimePoints.toLocaleString() ?? '0', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Transactions', value: overview?.totalTransactions.toLocaleString() ?? '0', icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <div className={clsx('flex items-center justify-center w-9 h-9 rounded-xl mb-3', bg)}>
                <Icon className={clsx('w-4.5 h-4.5', color)} />
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Tier breakdown + Quick action */}
        <div className="space-y-5">
          {/* Tier distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tier Distribution</h2>
            </div>
            <div className="p-4 space-y-2.5">
              {(['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as const).map((tier) => {
                const count = overview?.tierCounts[tier] ?? 0
                const pct = totalTierCustomers > 0 ? Math.round((count / totalTierCustomers) * 100) : 0
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', tierStyles[tier].badge)}>
                        {tier}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-300 tabular-nums">{count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', {
                          'bg-violet-400': tier === 'PLATINUM',
                          'bg-amber-400': tier === 'GOLD',
                          'bg-slate-400': tier === 'SILVER',
                          'bg-orange-400': tier === 'BRONZE',
                        })}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick action form */}
          {can('ADMIN', 'STAFF') && <QuickAction onSuccess={load} />}
        </div>

        {/* Right — Transactions (paginated) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transactions</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{txTotal.toLocaleString()} total</span>
          </div>
          {txLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !txData.length ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">No transactions yet</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {txData.map((tx) => {
                const customer = tx.loyaltyAccount.customer
                const isPositive = tx.type === 'EARN' || tx.type === 'ADJUST'
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold shrink-0">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-400 truncate">{tx.description}</p>
                    </div>
                    <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0', txTypeStyles[tx.type])}>
                      {tx.type}
                    </span>
                    <span className={clsx('text-sm font-semibold tabular-nums shrink-0 w-16 text-right',
                      isPositive ? 'text-emerald-600' : 'text-red-500')}>
                      {isPositive ? '+' : '−'}{tx.points.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 shrink-0 hidden sm:block">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {txTotalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{txPage} / {txTotalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setTxPage(txPage - 1); loadTransactions(txPage - 1) }}
                  disabled={txPage === 1 || txLoading}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setTxPage(txPage + 1); loadTransactions(txPage + 1) }}
                  disabled={txPage === txTotalPages || txLoading}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
