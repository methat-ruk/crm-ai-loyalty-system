// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'STAFF' | 'MARKETING'

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export type TransactionType = 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST'

export type RedemptionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export type CampaignType =
  | 'POINTS_MULTIPLIER'
  | 'BONUS_POINTS'
  | 'DISCOUNT'
  | 'FREE_REWARD'

export type ActivityType =
  | 'PROFILE_UPDATED'
  | 'POINTS_EARNED'
  | 'POINTS_REDEEMED'
  | 'REWARD_REDEEMED'
  | 'CAMPAIGN_JOINED'
  | 'TIER_UPGRADED'

export type InsightType =
  | 'CUSTOMER_SEGMENT'
  | 'CHURN_RISK'
  | 'PROMOTION_RECOMMENDATION'
  | 'BEHAVIOR_ANALYSIS'
  | 'GENERAL'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  tier: Tier
  isActive: boolean
  createdAt: string
  updatedAt: string
  loyaltyAccount?: LoyaltyAccount
}

export interface CustomerWithStats extends Customer {
  totalPoints: number
  totalRedemptions: number
}

export interface CreateCustomerPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {
  isActive?: boolean
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export interface LoyaltyAccount {
  id: string
  customerId: string
  totalPoints: number
  lifetimePoints: number
  createdAt: string
  updatedAt: string
}

export interface LoyaltyTransaction {
  id: string
  loyaltyAccountId: string
  type: TransactionType
  points: number
  description: string
  referenceId: string | null
  createdAt: string
}

export interface AdjustPointsPayload {
  customerId: string
  type: TransactionType
  points: number
  description: string
  referenceId?: string
}

// ─── Reward ───────────────────────────────────────────────────────────────────

export interface Reward {
  id: string
  name: string
  description: string | null
  pointsCost: number
  stock: number | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RewardRedemption {
  id: string
  customerId: string
  rewardId: string
  pointsUsed: number
  status: RedemptionStatus
  createdAt: string
  updatedAt: string
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email'>
  reward?: Pick<Reward, 'id' | 'name' | 'pointsCost'>
}

export interface CreateRewardPayload {
  name: string
  description?: string
  pointsCost: number
  stock?: number
  expiresAt?: string
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  description: string | null
  type: CampaignType
  pointsMultiplier: number | null
  bonusPoints: number | null
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignPayload {
  name: string
  description?: string
  type: CampaignType
  pointsMultiplier?: number
  bonusPoints?: number
  startDate: string
  endDate: string
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface CustomerActivity {
  id: string
  customerId: string
  type: ActivityType
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIInsight {
  id: string
  customerId: string | null
  type: InsightType
  content: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface AIInsightRequest {
  customerId?: string
  type: InsightType
  prompt?: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCustomers: number
  activeCustomers: number
  totalLoyaltyPoints: number
  totalRedemptions: number
  newCustomersThisMonth: number
}

export interface TopCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  tier: Tier
  totalPoints: number
  lifetimePoints: number
}

export interface TierDistributionItem {
  tier: Tier
  count: number
}

export interface TrendPoint {
  month: string
  count: number
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
