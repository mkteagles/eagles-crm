export type CopyCategory = 'social' | 'taller' | 'course'

export type CopyStatus =
  | 'pending'
  | 'generating'
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'changes_requested'

export interface CopyRequest {
  id: string
  title: string
  category: CopyCategory
  product_topic: string
  campaign_month: string | null
  channels: string[]
  objective: string
  tone: string
  audience: string | null
  brief: string
  call_to_action: string | null
  needs_image: boolean
  image_brief: string | null
  image_prompt: string | null
  status: CopyStatus
  assigned_to: string | null
  reviewer_id: string | null
  requested_by: string
  generated_copy: string | null
  final_copy: string | null
  feedback: string | null
  due_date: string | null
  generated_at: string | null
  reviewed_at: string | null
  published_at: string | null
  n8n_execution_id: string | null
  generation_error: string | null
  created_at: string
  updated_at: string
}

export const COPY_CATEGORIES = [
  { value: 'social', label: 'Redes sociales' },
  { value: 'taller', label: 'Transmisiones / Taller' },
  { value: 'course', label: 'Cursos presenciales' },
] as const

export const COPY_CHANNELS = [
  'Facebook',
  'Instagram',
  'TikTok',
  'WhatsApp',
] as const

export const COPY_OBJECTIVES = [
  'Venta',
  'Calentamiento',
  'Recordatorio',
  'Urgencia',
  'Contenido de valor',
  'Invitación a live',
] as const

export const COPY_TONES = [
  'Directo y profesional',
  'Cercano y educativo',
  'Urgente sin exagerar',
  'Técnico y confiable',
] as const

export const COPY_CAMPAIGNS = [
  {
    value: '2026-09',
    label: 'Septiembre 2026',
    topics: ['Curso presencial 6L80 y 6L90'],
  },
  {
    value: '2026-10',
    label: 'Octubre 2026',
    topics: ['Curso presencial CVT JF017'],
  },
  {
    value: '2026-11',
    label: 'Noviembre 2026',
    topics: [
      'Curso presencial DQ200',
      'Curso presencial CVT JF016 y JF017',
      'Curso presencial Chevrolet 6L80 y 6L90',
    ],
  },
] as const

// Presets de workshops mensuales. Agregar el siguiente lanzamiento aquí
// permite que aparezca como acceso rápido sin crear más formularios.
export const COPY_WORKSHOPS = [
  {
    id: 'transmisiones-convencionales-2026-09',
    campaignMonth: '2026-09',
    label: 'Workshop del mes · Septiembre',
    topic: 'Workshop Transmisiones Convencionales y Convertidor de Par',
    brief: 'Finales de septiembre. Fecha por confirmar. Online en vivo vía Zoom.',
    owner: 'marcos',
  },
] as const

export const COPY_STATUS_LABELS: Record<CopyStatus, string> = {
  pending: 'Solicitud',
  generating: 'Generando',
  draft: 'Borrador',
  review: 'En revisión',
  approved: 'Aprobado',
  published: 'Publicado',
  changes_requested: 'Con cambios',
}

export const COPY_STATUS_STYLES: Record<CopyStatus, string> = {
  pending: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  generating: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  draft: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  review: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  published: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300',
  changes_requested: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
}

export function getCampaignLabel(value: string | null) {
  return COPY_CAMPAIGNS.find((campaign) => campaign.value === value)?.label || 'Sin campaña'
}

export function getCategoryLabel(value: CopyCategory) {
  return COPY_CATEGORIES.find((category) => category.value === value)?.label || value
}
