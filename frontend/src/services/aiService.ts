import api from '@/lib/api'
import type { AIInsight, PaginatedResponse } from '@/types'

export interface CustomerInsightResult {
  insight: AIInsight
  customer: {
    id: string
    firstName: string
    lastName: string
    tier: string
    totalPoints: number
  }
}

export interface PromoRecommendationResult {
  insight: AIInsight
}

export interface ProviderInfo {
  provider: string
  model: string
}

const aiService = {
  getProvider(): Promise<ProviderInfo> {
    return api.get('/ai/provider').then((r) => r.data)
  },

  generateCustomerInsight(customerId: string): Promise<CustomerInsightResult> {
    return api.post('/ai/customer-insight', { customerId }).then((r) => r.data)
  },

  generatePromoRecommendation(): Promise<PromoRecommendationResult> {
    return api.post('/ai/promo-recommendation').then((r) => r.data)
  },

  getInsights(page = 1, limit = 10): Promise<PaginatedResponse<AIInsight & { customer: { id: string; firstName: string; lastName: string; tier: string } | null }>> {
    return api.get('/ai/insights', { params: { page, limit } }).then((r) => r.data)
  },
}

export default aiService
