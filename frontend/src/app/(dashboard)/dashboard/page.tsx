'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, UserCheck, Star, ShoppingBag } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { clsx } from 'clsx'
import analyticsService from '@/services/analyticsService'
import type { DashboardStats, TopCustomer, TierDistributionItem, TrendPoint, Tier } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<Tier, { badge: string; bar: string }> = {
  PLATINUM: { badge: 'bg-violet-100 text-violet-700', bar: '#7c3aed' },
  GOLD:     { badge: 'bg-amber-100 text-amber-700',   bar: '#d97706' },
  SILVER:   { badge: 'bg-slate-100 text-slate-600',   bar: '#64748b' },
  BRONZE:   { badge: 'bg-orange-100 text-orange-700', bar: '#c2410c' },
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  iconClass: string
  iconBg: string
  loading: boolean
}

const KpiCard = ({ label, value, sub, icon: Icon, iconClass, iconBg, loading }: KpiCardProps) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
    <div className={clsx('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', iconBg)}>
      <Icon className={clsx('w-5 h-5', iconClass)} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="mt-1 h-7 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="mt-0.5 text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      )}
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  </div>
)

// ─── Custom Tooltip for Trend Chart ───────────────────────────────────────────

const TrendTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-indigo-600 mt-0.5">{payload[0].value} new customers</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [tierDist, setTierDist] = useState<TierDistributionItem[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsService.getOverview(),
      analyticsService.getTopCustomers(5),
      analyticsService.getTierDistribution(),
      analyticsService.getNewCustomersTrend(6),
    ]).then(([overview, top, dist, trendData]) => {
      setStats(overview)
      setTopCustomers(top)
      setTierDist(dist)
      setTrend(trendData)
    }).finally(() => setLoading(false))
  }, [])

  const totalCustomers = stats?.totalCustomers ?? 0

  // Format month label: "2025-01" → "Jan 25"
  const formatMonth = (m: string) => {
    const [year, month] = m.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' })
  }

  const trendData = trend.map((t) => ({ ...t, label: formatMonth(t.month) }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">Overview of your CRM system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Customers"
          value={(stats?.totalCustomers ?? 0).toLocaleString()}
          sub={loading ? '—' : `+${stats?.newCustomersThisMonth ?? 0} this month`}
          icon={Users}
          iconBg="bg-indigo-50"
          iconClass="text-indigo-600"
          loading={loading}
        />
        <KpiCard
          label="Active Customers"
          value={(stats?.activeCustomers ?? 0).toLocaleString()}
          sub={loading || !stats ? '—' : `${Math.round((stats.activeCustomers / (stats.totalCustomers || 1)) * 100)}% of total`}
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconClass="text-emerald-600"
          loading={loading}
        />
        <KpiCard
          label="Total Loyalty Points"
          value={(stats?.totalLoyaltyPoints ?? 0).toLocaleString()}
          sub="Points in circulation"
          icon={Star}
          iconBg="bg-amber-50"
          iconClass="text-amber-600"
          loading={loading}
        />
        <KpiCard
          label="Total Redemptions"
          value={(stats?.totalRedemptions ?? 0).toLocaleString()}
          sub="Rewards redeemed"
          icon={ShoppingBag}
          iconBg="bg-violet-50"
          iconClass="text-violet-600"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* New Customers Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">New Customers</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-slate-400">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={trendData} barSize={28}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Tier Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customers by loyalty tier</p>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
                  <div className="h-2 bg-slate-100 rounded-full animate-pulse" />
                </div>
              ))
            ) : (
              (['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as Tier[]).map((tier) => {
                const item = tierDist.find((d) => d.tier === tier)
                const count = item?.count ?? 0
                const pct = totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', TIER_STYLES[tier].badge)}>
                        {tier}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {count.toLocaleString()} <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: TIER_STYLES[tier].bar }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Top Customers</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by current loyalty points</p>
          </div>
          <Link href="/customers" className="text-xs text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-5 h-3.5 bg-slate-100 rounded animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-44 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : topCustomers.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No customers yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topCustomers.map((customer, index) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <span className="w-5 text-xs font-medium text-slate-400 text-right shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{customer.email}</p>
                </div>
                <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', TIER_STYLES[customer.tier].badge)}>
                  {customer.tier}
                </span>
                <p className="text-sm font-semibold text-slate-700 shrink-0 tabular-nums">
                  {customer.totalPoints.toLocaleString()} pts
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
