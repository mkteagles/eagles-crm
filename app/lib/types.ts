export type ProductFilter =
  | 'all'
  | 'workshop'
  | 'empresarial'
  | 'costa_rica'

export type ProductType =
  | 'workshop'
  | 'empresarial'
  | 'costa_rica'

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refunded'

export type Currency = 'MXN' | 'USD'

export type Lead = {
  id: number
  meta_lead_id: string

  full_name: string
  phone_number: string
  email?: string

  platform: 'fb' | 'ig' | 'whatsapp' | 'hotmart' | 'manychat' | 'other'

  campaign_name?: string
  ad_name?: string

  lead_status:
    | 'new'
    | 'contacted'
    | 'interested'
    | 'qualified'
    | 'lost'

  score: number

  ws_messages_count: number
  last_message_date?: string
  response_rate?: number

  created_at: string
  updated_at: string
  last_contact_at?: string

  notes?: string
  source: string

  // PRODUCTO
  product?: ProductType

  // INFORMACIÓN COMERCIAL
  product_price?: number
  currency?: Currency
  amount_paid?: number
  payment_status?: PaymentStatus

  // Hotmart
  has_purchased?: boolean
  hotmart_customer_id?: string
  purchase_date?: string
  purchase_amount?: number

  // Relaciones
  lead_metrics?: {
    engagement_level: 'low' | 'medium' | 'high' | 'hot'
    total_interactions: number
    conversion_likelihood: number
  }
}

export type Interaction = {
  id: number
  lead_id: number
  type: string
  message?: string
  direction: 'inbound' | 'outbound'
  sentiment?: 'positive' | 'neutral' | 'negative'
  created_at: string
}