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
  activity_id: number | null
  created_at: string
  updated_at: string
}

export const COPY_CATEGORIES = [
  { value: 'social', label: 'Redes sociales' },
  { value: 'taller', label: 'Transmisiones / Taller' },
  { value: 'course', label: 'Cursos / capacitaciones' },
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

// Septiembre se conserva para etiquetar historial, pero ya no aparece como acceso rápido.
export const COPY_CAMPAIGNS = [
  {
    value: '2026-09',
    label: 'Septiembre 2026',
    topics: ['Curso presencial 6L80 y 6L90'],
    showQuick: false,
  },
  {
    value: '2026-10',
    label: 'Octubre 2026',
    topics: ['Curso Online CVT JF017'],
    showQuick: true,
  },
  {
    value: '2026-11',
    label: 'Noviembre 2026',
    topics: [
      'Curso presencial DQ200',
      'Curso presencial CVT JF016 y JF017',
      'Curso presencial Chevrolet 6L80 y 6L90',
    ],
    showQuick: true,
  },
] as const

export const WORKSHOP_WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/Gu955o9muhZ2eJGOaRw0wS?s=cl&p=i&mlu=4&ilr=4'
export const WORKSHOP_HOTMART_URL = 'https://pay.hotmart.com/U107474945W?bid=1788557927997'
export const JF017_OCTOBER_CONTACT = '449 110 7766'

// Workshop: flujo exclusivo de Marcos y grupo real ya en producción.
export const COPY_WORKSHOPS = [
  {
    id: 'transmisiones-convencionales-2026-10',
    campaignMonth: '2026-10',
    label: 'Workshop del mes · Octubre',
    topic: 'Workshop Transmisiones Automáticas Convencionales',
    brief: 'Workshop online en vivo sobre el sistema completo de transmisiones automáticas convencionales. Fechas: 2 y 3 de octubre de 2026. Modalidad: online en vivo vía Zoom. Inversión: 17 USD.',
    owner: 'marcos',
    socialCta: `Únete al grupo de WhatsApp para recibir toda la información: ${WORKSHOP_WHATSAPP_GROUP_URL}`,
    warmupCta: `Inscríbete aquí: ${WORKSHOP_HOTMART_URL}`,
    referenceFlyer: '/marketing/workshop-convencionales-2026-10/flyer-inicial.png',
    groupIcon: '/marketing/workshop-convencionales-2026-10/icono-grupo.jpeg',
  },
] as const

// Curso CVT JF017 de octubre: Úrsula trabaja, Victoria revisa.
// Los primeros calentamientos se programan al grupo PRUEBA_VICTORIA hasta cambiar la campaña a producción.
export const COPY_FEATURED_COURSES = [
  {
    id: 'cvt-jf017-online-2026-10',
    campaignMonth: '2026-10',
    label: 'Curso del mes · Octubre',
    topic: 'Curso Online CVT JF017',
    brief: [
      'Curso profesional 100% online CVT JF017.',
      'Fechas: 16 y 17 de octubre de 2026.',
      'Viernes: 11:00 AM a 5:00 PM hora México. Sábado: 11:00 AM a 3:00 PM hora México.',
      'Precio: $2,997 MXN. Aparta con $1,500 MXN. Cupos limitados.',
      'Incluye grabaciones, manuales de apoyo y calibraciones de regalo.',
      `Más información: ${JF017_OCTOBER_CONTACT}.`,
      'Banco técnico confirmado para variar contenidos: funcionamiento de la JF017/JF017E, sistema de poleas y cadena, fallas comunes, cuerpo de válvulas, TCM, actualización de software, códigos P17F0, P17F1, P0841, P0744, P0776, P0965, P0715 y P0720, además de deterioro térmico del aceite.',
      'Usar estos temas como ganchos educativos sin inventar información adicional ni diagnosticar definitivamente por mensaje.',
    ].join(' '),
    owner: 'ursula',
    reviewer: 'victoria',
    socialCta: `📲 Más información y reserva: ${JF017_OCTOBER_CONTACT}`,
    warmupCta: `📲 Reserva tu lugar: ${JF017_OCTOBER_CONTACT}`,
    referenceFlyer: '/marketing/curso-jf017-online-2026-10/flyer-inicial.png',
    imageBrief: 'Respetar la línea gráfica del flyer CVT JF017: fondo negro/azul oscuro, blanco y magenta, transmisión JF017 como protagonista, estética técnica y profesional. Puede variar entre flyer, detalle técnico o video, sin saturar de texto.',
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
