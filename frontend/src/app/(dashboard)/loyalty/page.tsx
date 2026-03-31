'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Star, TrendingUp, Users, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loyaltyService, type LoyaltyOverview } from '@/services/loyaltyService'
import { customerService } from '@/services/customerService'
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
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0">
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{c.email}</p>
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchKey, setSearchKey] = useState(0)

  const reset = () => {
    setCustomer(null)
    setPoints('')
    setDescription('')
    setError('')
    setSuccess('')
    setSearchKey((k) => k + 1)
  }

  const handleTabChange = (t: ActionTab) => {
    setTab(t)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!customer) { setError('Please select a customer'); return }
    const pts = parseInt(points)
    if (!pts || pts <= 0) { setError('Points must be a positive number'); return }
    if (!description.trim()) { setError('Description is required'); return }

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
        setSuccess(`${result.message} · Tier upgraded to ${result.tier}!`)
      } else {
        setSuccess(result.message)
      }
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
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Quick Action</h2>
        {/* Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => handleTabChange('earn')}
            className={clsx(
              'px-3 py-1.5 transition-colors cursor-pointer',
              tab === 'earn' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            + Earn
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('redeem')}
            className={clsx(
              'px-3 py-1.5 transition-colors cursor-pointer',
              tab === 'redeem' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            − Redeem
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Customer</label>
          <CustomerSearch key={searchKey} value={customer} onSelect={setCustomer} />
          {customer && (
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', tierStyles[customer.tier].badge)}>
                {customer.tier}
              </span>
              <span className="text-xs text-slate-500">
                Balance:{' '}
                <span className="font-semibold text-indigo-600 tabular-nums">
                  {(customer.loyaltyAccount?.totalPoints ?? 0).toLocaleString()} pts
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Points</label>
          <Input
            type="number"
            placeholder="e.g. 100"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min={1}
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Description</label>
          <Input
            placeholder={tab === 'earn' ? 'e.g. Purchase #1234' : 'e.g. Redeem for coffee'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <Star className="w-3.5 h-3.5 shrink-0" />
            {success}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            onClick={reset}
            className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-600"
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
  const [overview, setOverview] = useState<LoyaltyOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await loyaltyService.getOverview()
      setOverview(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const totalTierCustomers =
    (overview?.tierCounts.BRONZE ?? 0) +
    (overview?.tierCounts.SILVER ?? 0) +
    (overview?.tierCounts.GOLD ?? 0) +
    (overview?.tierCounts.PLATINUM ?? 0)

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Loyalty</h1>
        <p className="text-sm text-slate-400 mt-0.5">Points overview and quick actions</p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
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
            <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className={clsx('flex items-center justify-center w-9 h-9 rounded-xl mb-3', bg)}>
                <Icon className={clsx('w-4.5 h-4.5', color)} />
              </div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Tier breakdown + Quick action */}
        <div className="space-y-5">
          {/* Tier distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Tier Distribution</h2>
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
                      <span className="text-xs text-slate-500 tabular-nums">{count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
          <QuickAction onSuccess={load} />
        </div>

        {/* Right — Recent transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !overview?.recentTransactions.length ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No transactions yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overview.recentTransactions.map((tx) => {
                const customer = tx.loyaltyAccount.customer
                const isPositive = tx.type === 'EARN' || tx.type === 'ADJUST'
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                    {/* Avatar */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    {/* Customer + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{tx.description}</p>
                    </div>
                    {/* Type badge */}
                    <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0', txTypeStyles[tx.type])}>
                      {tx.type}
                    </span>
                    {/* Points */}
                    <span className={clsx('text-sm font-semibold tabular-nums shrink-0 w-16 text-right',
                      isPositive ? 'text-emerald-600' : 'text-red-500')}>
                      {isPositive ? '+' : '−'}{tx.points.toLocaleString()}
                    </span>
                    {/* Date */}
                    <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
