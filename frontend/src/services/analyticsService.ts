import api from '@/lib/api'
import type { DashboardStats, TopCustomer, TierDistributionItem, TrendPoint } from '@/types'

const analyticsService = {
  getOverview(): Promise<DashboardStats> {
    return api.get('/analytics/overview').then((r) => r.data)
  },

  getTopCustomers(limit = 10): Promise<TopCustomer[]> {
    return api.get('/analytics/top-customers', { params: { limit } }).then((r) => r.data)
  },

  getTierDistribution(): Promise<TierDistributionItem[]> {
    return api.get('/analytics/tier-distribution').then((r) => r.data)
  },

  getNewCustomersTrend(months = 6): Promise<TrendPoint[]> {
    return api.get('/analytics/new-customers-trend', { params: { months } }).then((r) => r.data)
  },
}

export default analyticsService
