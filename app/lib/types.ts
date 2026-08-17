// =======================================================
// TIPOS GENERALES DEL CRM
// =======================================================

export type Currency =
  | 'MXN'
  | 'USD'

export type Role =
  | 'admin'
  | 'viewer'
  | 'executor'

// =======================================================
// PRODUCTOS
// =======================================================
//
// IMPORTANTE:
//
// workshop = Workshop High Ticket
// workshop_lite = Workshop Lite
// empresarial = Empresarial
// costa_rica = Oferta Costa Rica
//
// =======================================================

export type ProductType =
  | 'workshop'
  | 'workshop_lite'
  | 'empresarial'
  | 'costa_rica'

// =======================================================
// FILTRO DE PRODUCTOS
// =======================================================

export type ProductFilter =
  | 'all'
  | 'workshop'
  | 'workshop_lite'
  | 'empresarial'
  | 'costa_rica'

// =======================================================
// PLATAFORMAS
// =======================================================

export type Platform =
  | 'fb'
  | 'ig'
  | 'whatsapp'
  | 'hotmart'
  | 'manychat'
  | 'other'

// =======================================================
// ESTADOS DEL LEAD
// =======================================================

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'follow_up'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'inactive'

// =======================================================
// ESTADOS DE PAGO
// =======================================================

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'

// =======================================================
// TEMPERATURA / SEGMENTACIÓN
// =======================================================

export type LeadTemperature =
  | 'cold'
  | 'warm'
  | 'hot'

// =======================================================
// DIRECCIÓN DE INTERACCIÓN
// =======================================================

export type InteractionDirection =
  | 'inbound'
  | 'outbound'

// =======================================================
// TIPO DE INTERACCIÓN
// =======================================================

export type InteractionType =
  | 'message'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'email'
  | 'call'
  | 'note'
  | 'follow_up'
  | 'other'

// =======================================================
// PRODUCT CONFIG
// =======================================================
//
// Este tipo representa la configuración comercial
// de cada producto.
// =======================================================

export interface ProductConfig {
  label: string
  shortLabel?: string
  price: number
  currency: Currency
  description?: string
}

// =======================================================
// LEAD METRICS
// =======================================================

export interface LeadMetrics {
  id: string

  lead_id: string

  engagement_level:
    | 'low'
    | 'medium'
    | 'high'
    | 'very_high'

  total_interactions: number

  inbound_messages: number

  outbound_messages: number

  last_interaction_at:
    string | null

  response_time_seconds:
    number | null

  conversion_probability:
    number | null

  created_at: string

  updated_at: string
}

// =======================================================
// LEAD
// =======================================================

export interface Lead {

  // -----------------------------------------------------
  // IDENTIFICACIÓN
  // -----------------------------------------------------

  id: string

  full_name: string

  phone_number: string

  email: string | null

  // -----------------------------------------------------
  // ORIGEN
  // -----------------------------------------------------

  platform: Platform | string

  source: string | null

  campaign_name: string | null

  // -----------------------------------------------------
  // PRODUCTO
  // -----------------------------------------------------

  product: ProductType

  product_price: number

  currency: Currency

  // -----------------------------------------------------
  // PAGOS
  // -----------------------------------------------------

  amount_paid: number

  payment_status: PaymentStatus

  // -----------------------------------------------------
  // ESTADO COMERCIAL
  // -----------------------------------------------------

  lead_status: LeadStatus

  score: number

  temperature?: LeadTemperature | null

  has_purchased: boolean

  // -----------------------------------------------------
  // INFORMACIÓN ADICIONAL
  // -----------------------------------------------------

  notes: string | null

  // -----------------------------------------------------
  // ASIGNACIÓN
  // -----------------------------------------------------

  assigned_to?: string | null

  created_by?: string | null

  // -----------------------------------------------------
  // FECHAS
  // -----------------------------------------------------

  created_at: string

  updated_at?: string | null

  // -----------------------------------------------------
  // MÉTRICAS
  // -----------------------------------------------------

  lead_metrics?:
    | LeadMetrics
    | LeadMetrics[]
    | null
}

// =======================================================
// LEAD PARA CREACIÓN
// =======================================================

export interface CreateLeadInput {

  full_name: string

  phone_number: string

  email?: string | null

  platform: Platform | string

  source?: string | null

  campaign_name?: string | null

  product: ProductType

  product_price: number

  currency: Currency

  amount_paid: number

  payment_status: PaymentStatus

  lead_status?: LeadStatus

  score?: number

  notes?: string | null

  assigned_to?: string | null

}

// =======================================================
// LEAD PARA EDICIÓN
// =======================================================

export interface UpdateLeadInput {

  full_name?: string

  phone_number?: string

  email?: string | null

  platform?: Platform | string

  source?: string | null

  campaign_name?: string | null

  product?: ProductType

  product_price?: number

  currency?: Currency

  amount_paid?: number

  payment_status?: PaymentStatus

  lead_status?: LeadStatus

  score?: number

  temperature?: LeadTemperature | null

  has_purchased?: boolean

  notes?: string | null

  assigned_to?: string | null
}

// =======================================================
// INTERACTION
// =======================================================

export interface Interaction {

  id: string

  lead_id: string

  direction: InteractionDirection

  type: InteractionType | string

  message: string

  platform?: Platform | string | null

  created_at: string

  created_by?: string | null
}

// =======================================================
// CREAR INTERACCIÓN
// =======================================================

export interface CreateInteractionInput {

  lead_id: string

  direction: InteractionDirection

  type: InteractionType | string

  message: string

  platform?: Platform | string | null
}

// =======================================================
// FILTROS DE LEADS
// =======================================================

export type StatusFilter =
  | 'all'
  | LeadStatus

export type PlatformFilter =
  | 'all'
  | Platform

// =======================================================
// FILTROS GENERALES DEL CRM
// =======================================================

export interface LeadFilters {

  product?: ProductFilter

  status?: StatusFilter

  platform?: PlatformFilter

  search?: string
}

// =======================================================
// PERFIL DE USUARIO
// =======================================================

export interface UserProfile {

  id: string

  full_name: string | null

  email?: string | null

  role: Role

  created_at?: string

  updated_at?: string
}

// =======================================================
// PRODUCTOS DISPONIBLES
// =======================================================

export interface ProductOption {

  value: ProductType

  label: string

  price: number

  currency: Currency
}

// =======================================================
// PRODUCTOS DEL CRM
// =======================================================
//
// Los precios comerciales actuales.
// =======================================================

export const PRODUCTS: Record<
  ProductType,
  ProductConfig
> = {

  // -----------------------------------------------------
  // WORKSHOP HIGH TICKET
  // -----------------------------------------------------

  workshop: {

    label: '🎓 Workshop High Ticket',

    shortLabel: 'Workshop',

    price: 10000,

    currency: 'MXN',

    description:
      'Workshop completo de alto valor.',
  },

  // -----------------------------------------------------
  // WORKSHOP LITE
  // -----------------------------------------------------

  workshop_lite: {

    label: '🎓 Workshop Lite',

    shortLabel: 'Workshop Lite',

    price: 14,

    currency: 'USD',

    description:
      'Producto de entrada Workshop Lite.',
  },

  // -----------------------------------------------------
  // EMPRESARIAL
  // -----------------------------------------------------

  empresarial: {

    label: '🏢 Empresarial',

    shortLabel: 'Empresarial',

    price: 5997,

    currency: 'MXN',

    description:
      'Modalidad empresarial.',
  },

  // -----------------------------------------------------
  // COSTA RICA
  // -----------------------------------------------------

  costa_rica: {

    label: '🇨🇷 Costa Rica',

    shortLabel: 'Costa Rica',

    price: 540,

    currency: 'USD',

    description:
      'Oferta comercial Costa Rica.',
  },
}

// =======================================================
// OPCIONES PARA SELECTS
// =======================================================

export const PRODUCT_OPTIONS:
  ProductOption[] = [

  {
    value: 'workshop',

    label:
      '🎓 Workshop High Ticket',

    price: 10000,

    currency: 'MXN',
  },

  {
    value: 'workshop_lite',

    label:
      '🎓 Workshop Lite',

    price: 14,

    currency: 'USD',
  },

  {
    value: 'empresarial',

    label:
      '🏢 Empresarial',

    price: 5997,

    currency: 'MXN',
  },

  {
    value: 'costa_rica',

    label:
      '🇨🇷 Costa Rica',

    price: 540,

    currency: 'USD',
  },
]

// =======================================================
// HELPERS
// =======================================================

export function getProductConfig(
  product: ProductType
): ProductConfig {

  return PRODUCTS[product]
}

// =======================================================
// FORMATEAR PRECIO
// =======================================================

export function formatPrice(
  amount: number,
  currency: Currency
): string {

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency,
    }
  ).format(amount)
}

// =======================================================
// CALCULAR SALDO
// =======================================================

export function calculateBalance(
  price: number,
  amountPaid: number
): number {

  return Math.max(
    price - amountPaid,
    0
  )
}

// =======================================================
// CALCULAR ESTADO DE PAGO
// =======================================================

export function calculatePaymentStatus(
  price: number,
  amountPaid: number
): PaymentStatus {

  if (amountPaid <= 0) {

    return 'unpaid'
  }

  if (amountPaid < price) {

    return 'partial'
  }

  return 'paid'
}

// =======================================================
// NOMBRE DEL PRODUCTO
// =======================================================

export function getProductLabel(
  product: ProductType
): string {

  return PRODUCTS[product]?.label ||
    product
}

// =======================================================
// CURRENCY GUARD
// =======================================================

export function isCurrency(
  value: string
): value is Currency {

  return (
    value === 'MXN' ||
    value === 'USD'
  )
}

// =======================================================
// PRODUCT TYPE GUARD
// =======================================================

export function isProductType(
  value: string
): value is ProductType {

  return (
    value === 'workshop' ||
    value === 'workshop_lite' ||
    value === 'empresarial' ||
    value === 'costa_rica'
  )
}