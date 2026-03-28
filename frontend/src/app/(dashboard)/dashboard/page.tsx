import { Users, UserCheck, Star, ShoppingBag } from 'lucide-react'
import type { DashboardStats, TopCustomer, Tier } from '@/types'
import { clsx } from 'clsx'

// ─── Mock data (replace with API call later) ──────────────────────────────────

const mockStats: DashboardStats = {
  totalCustomers: 1284,
  activeCustomers: 947,
  totalLoyaltyPoints: 2_348_500,
  totalRedemptions: 312,
  newCustomersThisMonth: 58,
}

const mockTopCustomers: TopCustomer[] = [
  { id: '1', firstName: 'Arisa', lastName: 'Tanaka', email: 'arisa@example.com', tier: 'PLATINUM', totalPoints: 48200, lifetimePoints: 128400 },
  { id: '2', firstName: 'James', lastName: 'Wongchai', email: 'james@example.com', tier: 'GOLD', totalPoints: 36100, lifetimePoints: 94200 },
  { id: '3', firstName: 'Nadia', lastName: 'Patel', email: 'nadia@example.com', tier: 'GOLD', totalPoints: 29800, lifetimePoints: 77500 },
  { id: '4', firstName: 'Somchai', lastName: 'Buranasiri', email: 'somchai@example.com', tier: 'SILVER', totalPoints: 18450, lifetimePoints: 43200 },
  { id: '5', firstName: 'Emily', lastName: 'Chen', email: 'emily@example.com', tier: 'SILVER', totalPoints: 14700, lifetimePoints: 38100 },
]

// ─── Tier badge ───────────────────────────────────────────────────────────────

const tierStyles: Record<Tier, string> = {
  PLATINUM: 'bg-violet-100 text-violet-700',
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-slate-100 text-slate-600',
  BRONZE: 'bg-orange-100 text-orange-700',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  iconClass: string
  iconBg: string
}

const KpiCard = ({ label, value, sub, icon: Icon, iconClass, iconBg }: KpiCardProps) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
    <div className={clsx('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', iconBg)}>
      <Icon className={clsx('w-5 h-5', iconClass)} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
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
          value={mockStats.totalCustomers.toLocaleString()}
          sub={`+${mockStats.newCustomersThisMonth} this month`}
          icon={Users}
          iconBg="bg-indigo-50"
          iconClass="text-indigo-600"
        />
        <KpiCard
          label="Active Customers"
          value={mockStats.activeCustomers.toLocaleString()}
          sub={`${Math.round((mockStats.activeCustomers / mockStats.totalCustomers) * 100)}% of total`}
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconClass="text-emerald-600"
        />
        <KpiCard
          label="Total Loyalty Points"
          value={mockStats.totalLoyaltyPoints.toLocaleString()}
          sub="Points in circulation"
          icon={Star}
          iconBg="bg-amber-50"
          iconClass="text-amber-600"
        />
        <KpiCard
          label="Total Redemptions"
          value={mockStats.totalRedemptions.toLocaleString()}
          sub="Rewards redeemed"
          icon={ShoppingBag}
          iconBg="bg-violet-50"
          iconClass="text-violet-600"
        />
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Top Customers</h2>
          <p className="text-xs text-slate-400 mt-0.5">Ranked by current loyalty points</p>
        </div>
        <div className="divide-y divide-slate-100">
          {mockTopCustomers.map((customer, index) => (
            <div key={customer.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <span className="w-5 text-xs font-medium text-slate-400 text-right shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{customer.email}</p>
              </div>
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', tierStyles[customer.tier])}>
                {customer.tier}
              </span>
              <p className="text-sm font-semibold text-slate-700 shrink-0 tabular-nums">
                {customer.totalPoints.toLocaleString()} pts
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
