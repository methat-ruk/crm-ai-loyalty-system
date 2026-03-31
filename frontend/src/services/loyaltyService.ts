import api from '@/lib/api'
import type { LoyaltyTransaction, PaginatedResponse, Tier } from '@/types'

// ─── Response types ───────────────────────────────────────────────────────────

export interface LoyaltyAccountDetail {
  id: string
  customerId: string
  totalPoints: number
  lifetimePoints: number
  createdAt: string
  updatedAt: string
  customer: { id: string; firstName: string; lastName: string; tier: Tier }
  transactions: LoyaltyTransaction[]
  nextTier: { tier: Tier; pointsNeeded: number; threshold: number } | null
}

export interface LoyaltyOverview {
  totalAccounts: number
  totalPoints: number
  totalLifetimePoints: number
  totalTransactions: number
  tierCounts: { BRONZE: number; SILVER: number; GOLD: number; PLATINUM: number }
  recentTransactions: (LoyaltyTransaction & {
    loyaltyAccount: {
      customer: { id: string; firstName: string; lastName: string; tier: Tier }
    }
  })[]
}

export interface EarnRedeemPayload {
  customerId: string
  points: number
  description: string
  referenceId?: string
}

export interface AdjustPayload {
  customerId: string
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST'
  points: number
  description: string
  referenceId?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const loyaltyService = {
  getOverview: async (): Promise<LoyaltyOverview> => {
    const { data } = await api.get<LoyaltyOverview>('/loyalty/overview')
    return data
  },

  getAccount: async (customerId: string): Promise<LoyaltyAccountDetail> => {
    const { data } = await api.get<LoyaltyAccountDetail>(`/loyalty/${customerId}`)
    return data
  },

  getTransactions: async (
    customerId: string,
    params?: { page?: number; limit?: number; type?: string },
  ): Promise<PaginatedResponse<LoyaltyTransaction>> => {
    const { data } = await api.get<PaginatedResponse<LoyaltyTransaction>>(
      `/loyalty/${customerId}/transactions`,
      { params },
    )
    return data
  },

  earn: async (payload: EarnRedeemPayload) => {
    const { data } = await api.post('/loyalty/earn', payload)
    return data
  },

  redeem: async (payload: EarnRedeemPayload) => {
    const { data } = await api.post('/loyalty/redeem', payload)
    return data
  },

  adjust: async (payload: AdjustPayload) => {
    const { data } = await api.post('/loyalty/adjust', payload)
    return data
  },
}
