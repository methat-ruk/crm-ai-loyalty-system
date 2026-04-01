import api from '@/lib/api'
import type { Campaign, CreateCampaignPayload, PaginatedResponse } from '@/types'

export interface CampaignWithExpiry extends Campaign {
  isExpired: boolean
}

const promotionService = {
  getAll(params?: {
    search?: string
    type?: string
    isActive?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<CampaignWithExpiry>> {
    return api.get('/promotions', { params }).then((r) => r.data)
  },

  getOne(id: string): Promise<CampaignWithExpiry> {
    return api.get(`/promotions/${id}`).then((r) => r.data)
  },

  create(payload: CreateCampaignPayload): Promise<Campaign> {
    return api.post('/promotions', payload).then((r) => r.data)
  },

  update(id: string, payload: Partial<CreateCampaignPayload>): Promise<Campaign> {
    return api.patch(`/promotions/${id}`, payload).then((r) => r.data)
  },

  toggle(id: string): Promise<Campaign> {
    return api.patch(`/promotions/${id}/toggle`).then((r) => r.data)
  },

  remove(id: string): Promise<void> {
    return api.delete(`/promotions/${id}`).then((r) => r.data)
  },
}

export default promotionService
