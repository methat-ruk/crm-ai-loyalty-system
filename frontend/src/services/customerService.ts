import api from '@/lib/api'
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  PaginatedResponse,
} from '@/types'

export interface CustomerDetail extends Omit<Customer, 'loyaltyAccount'> {
  loyaltyAccount?: {
    id: string
    totalPoints: number
    lifetimePoints: number
    transactions: {
      id: string
      type: string
      points: number
      description: string
      createdAt: string
    }[]
  }
  activities: {
    id: string
    type: string
    description: string
    createdAt: string
  }[]
  redemptions: {
    id: string
    pointsUsed: number
    status: string
    createdAt: string
    reward: { id: string; name: string; pointsCost: number }
  }[]
}

export const customerService = {
  getAll: async (params?: {
    search?: string
    page?: number
    limit?: number
    tiers?: string[]
    isActive?: boolean
    pointsMin?: number
    pointsMax?: number
  }): Promise<PaginatedResponse<Customer> & { activeCount: number; inactiveCount: number }> => {
    const { tiers, ...rest } = params ?? {}
    const normalized = { ...rest, ...(tiers?.length ? { tiers: tiers.join(',') } : {}) }
    const { data } = await api.get<PaginatedResponse<Customer> & { activeCount: number; inactiveCount: number }>('/customers', { params: normalized })
    return data
  },

  getOne: async (id: string): Promise<CustomerDetail> => {
    const { data } = await api.get<CustomerDetail>(`/customers/${id}`)
    return data
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const { data } = await api.post<Customer>('/customers', payload)
    return data
  },

  update: async (
    id: string,
    payload: UpdateCustomerPayload,
  ): Promise<Customer> => {
    const { data } = await api.patch<Customer>(`/customers/${id}`, payload)
    return data
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/customers/${id}`)
    return data
  },

  checkEmail: async (email: string, excludeId?: string): Promise<{ available: boolean }> => {
    const { data } = await api.get<{ available: boolean }>('/customers/check-email', {
      params: { email, excludeId },
    })
    return data
  },
}
