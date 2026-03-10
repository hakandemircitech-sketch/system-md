// API Request/Response Tipleri

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface GenerateBlueprintRequest {
  idea: string
  sector?: string
  stage?: string
  model?: 'standard' | 'power'
}

export interface GenerateBlueprintResponse {
  blueprintId: string
  status: 'started'
}

export interface AnalyticsOverview {
  mrr: number
  mrr_change: number
  total_users: number
  users_change: number
  total_blueprints: number
  blueprints_change: number
  churn_rate: number
  churn_change: number
}

export interface CheckoutRequest {
  priceId: string
  billingPeriod: 'monthly' | 'yearly'
}

export interface CheckoutResponse {
  url: string
}
