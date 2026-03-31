'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, ShoppingBag, Clock, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/Customer/CustomerForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { customerService, type CustomerDetail } from '@/services/customerService'
import { loyaltyService } from '@/services/loyaltyService'
import type { Tier } from '@/types'

// ─── Tier badge ───────────────────────────────────────────────────────────────

const tierStyles: Record<Tier, string> = {
  PLATINUM: 'bg-violet-100 text-violet-700',
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-slate-100 text-slate-600',
  BRONZE: 'bg-orange-100 text-orange-700',
}

const TIER_THRESHOLDS: Record<Tier, number> = {
  BRONZE: 0, SILVER: 1000, GOLD: 5000, PLATINUM: 20000,
}
const TIER_ORDER: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
const TIER_BAR_COLOR: Record<Tier, string> = {
  BRONZE: 'bg-orange-400', SILVER: 'bg-slate-400', GOLD: 'bg-amber-400', PLATINUM: 'bg-violet-400',
}

const TierProgress = ({ tier, lifetimePoints }: { tier: Tier; lifetimePoints: number }) => {
  const idx = TIER_ORDER.indexOf(tier)
  if (idx === TIER_ORDER.length - 1) {
    return <p className="text-xs text-violet-600 font-medium text-center">✦ Max tier reached</p>
  }
  const next = TIER_ORDER[idx + 1]
  const from = TIER_THRESHOLDS[tier]
  const to = TIER_THRESHOLDS[next]
  const pct = Math.min(100, Math.round(((lifetimePoints - from) / (to - from)) * 100))
  const needed = to - lifetimePoints
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{needed.toLocaleString()} pts to <span className={clsx('font-medium', tierStyles[next])}>{next}</span></span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', TIER_BAR_COLOR[next])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
)

const EmptyRow = ({ label }: { label: string }) => (
  <div className="px-5 py-6 text-center text-sm text-slate-400">{label}</div>
)

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
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1 || loading}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages || loading}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  // Transactions pagination
  const [txPage, setTxPage] = useState(1)
  const [txData, setTxData] = useState<CustomerDetail['loyaltyAccount']>()
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txLoading, setTxLoading] = useState(false)

  // Redemptions pagination
  const [rdPage, setRdPage] = useState(1)
  const [rdData, setRdData] = useState<CustomerDetail['redemptions']>([])
  const [rdTotalPages, setRdTotalPages] = useState(1)
  const [rdLoading, setRdLoading] = useState(false)

  // Activities pagination
  const [acPage, setAcPage] = useState(1)
  const [acData, setAcData] = useState<CustomerDetail['activities']>([])
  const [acTotalPages, setAcTotalPages] = useState(1)
  const [acLoading, setAcLoading] = useState(false)

  const loadTransactions = useCallback(async (cid: string, p: number) => {
    setTxLoading(true)
    try {
      const res = await loyaltyService.getTransactions(cid, { page: p, limit: 10 })
      setTxData((prev) => prev ? { ...prev, transactions: res.data } : prev)
      setTxTotalPages(res.totalPages)
    } finally { setTxLoading(false) }
  }, [])

  const loadRedemptions = useCallback(async (cid: string, p: number) => {
    setRdLoading(true)
    try {
      const res = await customerService.getRedemptions(cid, { page: p, limit: 10 })
      setRdData(res.data as CustomerDetail['redemptions'])
      setRdTotalPages(res.totalPages)
    } finally { setRdLoading(false) }
  }, [])

  const loadActivities = useCallback(async (cid: string, p: number) => {
    setAcLoading(true)
    try {
      const res = await customerService.getActivities(cid, { page: p, limit: 10 })
      setAcData(res.data as CustomerDetail['activities'])
      setAcTotalPages(res.totalPages)
    } finally { setAcLoading(false) }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await customerService.getOne(id)
      setCustomer(data)
      setTxData(data.loyaltyAccount)
      setRdData(data.redemptions)
      setAcData(data.activities)
    } catch {
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const handleEditSuccess = () => { setShowEdit(false); load() }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await customerService.remove(id)
      router.push('/customers')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!customer) return
    setTogglingStatus(true)
    try {
      await customerService.update(id, { isActive: !customer.isActive })
      setShowStatusConfirm(false)
      load()
    } finally {
      setTogglingStatus(false)
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

  if (!customer) return null

  const fullName = `${customer.firstName} ${customer.lastName}`
  const initials = `${customer.firstName[0]}${customer.lastName[0]}`

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowStatusConfirm(true)}
            className={clsx(
              'cursor-pointer',
              customer.isActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
            )}
          >
            {customer.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 flex-wrap">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 text-lg font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-800">{fullName}</h1>
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', tierStyles[customer.tier])}>
              {customer.tier}
            </span>
            <span
              className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                customer.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500',
              )}
            >
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{customer.email}</p>
          {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
          {customer.dateOfBirth && (
            <p className="text-sm text-slate-400">
              DOB: {new Date(customer.dateOfBirth).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Points summary + tier progress */}
        {customer.loyaltyAccount && (
          <div className="flex flex-col gap-3 shrink-0 min-w-0 sm:min-w-48">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 tabular-nums">
                  {customer.loyaltyAccount.totalPoints.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Current Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-700 tabular-nums">
                  {customer.loyaltyAccount.lifetimePoints.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Lifetime Points</p>
              </div>
            </div>
            <TierProgress tier={customer.tier} lifetimePoints={customer.loyaltyAccount.lifetimePoints} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Transactions */}
        <Section title="Transactions">
          {txLoading ? (
            <div className="px-5 py-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : !txData?.transactions.length ? (
            <EmptyRow label="No transactions yet" />
          ) : (
            txData.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                <div className={clsx('flex items-center justify-center w-7 h-7 rounded-full shrink-0', tx.type === 'EARN' ? 'bg-emerald-100' : 'bg-red-100')}>
                  <Star className={clsx('w-3.5 h-3.5', tx.type === 'EARN' ? 'text-emerald-600' : 'text-red-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className={clsx('text-sm font-semibold tabular-nums shrink-0', tx.type === 'EARN' ? 'text-emerald-600' : 'text-red-500')}>
                  {tx.type === 'EARN' ? '+' : '-'}{tx.points.toLocaleString()}
                </span>
              </div>
            ))
          )}
          <PageControls page={txPage} totalPages={txTotalPages} loading={txLoading} onChange={(p) => { setTxPage(p); loadTransactions(id, p) }} />
        </Section>

        {/* Redemptions */}
        <Section title="Redemptions">
          {rdLoading ? (
            <div className="px-5 py-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : !rdData.length ? (
            <EmptyRow label="No redemptions yet" />
          ) : (
            rdData.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{r.reward.name}</p>
                  <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-700 tabular-nums">{r.pointsUsed.toLocaleString()} pts</p>
                  <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full',
                    r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    r.status === 'PENDING'   ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600')}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))
          )}
          <PageControls page={rdPage} totalPages={rdTotalPages} loading={rdLoading} onChange={(p) => { setRdPage(p); loadRedemptions(id, p) }} />
        </Section>

        {/* Activity Timeline */}
        <Section title="Activity Timeline">
          {acLoading ? (
            <div className="px-5 py-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : !acData.length ? (
            <EmptyRow label="No activity yet" />
          ) : (
            acData.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{a.description}</p>
                  <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 mt-0.5">{a.type.replace(/_/g, ' ')}</span>
              </div>
            ))
          )}
          <PageControls page={acPage} totalPages={acTotalPages} loading={acLoading} onChange={(p) => { setAcPage(p); loadActivities(id, p) }} />
        </Section>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <CustomerForm
          customer={customer}
          onClose={() => setShowEdit(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Deactivate/Activate confirm */}
      {showStatusConfirm && (
        <ConfirmDialog
          title={customer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
          description={
            customer.isActive
              ? `Deactivate "${customer.firstName} ${customer.lastName}"? They will no longer appear as active.`
              : `Activate "${customer.firstName} ${customer.lastName}"?`
          }
          confirmLabel={customer.isActive ? 'Deactivate' : 'Activate'}
          confirmClass={
            customer.isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }
          onConfirm={handleToggleStatus}
          onCancel={() => setShowStatusConfirm(false)}
          loading={togglingStatus}
        />
      )}

      {/* Delete confirm */}
      {showDelete && (
        <ConfirmDialog
          title="Delete Customer"
          description={`Are you sure you want to delete "${customer.firstName} ${customer.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </div>
  )
}
