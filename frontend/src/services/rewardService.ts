import api from '@/lib/api'
import type { Reward, RewardRedemption, PaginatedResponse } from '@/types'

// ─── Response types ───────────────────────────────────────────────────────────

export interface RewardWithCount extends Reward {
  _count: { redemptions: number }
}

export interface RewardDetail extends RewardWithCount {
  redemptions: (RewardRedemption & {
    customer: { id: string; firstName: string; lastName: string; email: string; tier: string }
  })[]
}

export interface RewardsListResponse extends PaginatedResponse<RewardWithCount> {
  activeCount: number
  inactiveCount: number
  totalRedemptions: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const rewardService = {
  getAll: async (params?: {
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
  }): Promise<RewardsListResponse> => {
    const { data } = await api.get<RewardsListResponse>('/rewards', { params })
    return data
  },

  getOne: async (id: string): Promise<RewardDetail> => {
    const { data } = await api.get<RewardDetail>(`/rewards/${id}`)
    return data
  },

  create: async (payload: {
    name: string
    description?: string
    pointsCost: number
    stock?: number
    expiresAt?: string
  }): Promise<Reward> => {
    const { data } = await api.post<Reward>('/rewards', payload)
    return data
  },

  update: async (
    id: string,
    payload: Partial<{
      name: string
      description: string
      pointsCost: number
      stock: number
      expiresAt: string
      isActive: boolean
    }>,
  ): Promise<Reward> => {
    const { data } = await api.patch<Reward>(`/rewards/${id}`, payload)
    return data
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/rewards/${id}`)
    return data
  },

  getRedemptions: async (
    rewardId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<RewardDetail['redemptions'][number]>> => {
    const { data } = await api.get(`/rewards/${rewardId}/redemptions`, { params })
    return data
  },

  redeem: async (rewardId: string, customerId: string): Promise<RewardRedemption> => {
    const { data } = await api.post<RewardRedemption>(`/rewards/${rewardId}/redeem`, { customerId })
    return data
  },

  updateRedemptionStatus: async (
    redemptionId: string,
    status: 'COMPLETED' | 'CANCELLED',
  ): Promise<RewardRedemption> => {
    const { data } = await api.patch<RewardRedemption>(
      `/rewards/redemptions/${redemptionId}/status`,
      { status },
    )
    return data
  },
}
