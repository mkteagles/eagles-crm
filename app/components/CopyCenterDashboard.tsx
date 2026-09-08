'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  ImageIcon,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  X,
} from 'lucide-react'

import { useCurrentUser } from '@/lib/marketing-hooks'
import { createClient } from '@/lib/supabase/client'
import {
  COPY_CAMPAIGNS,
  COPY_CATEGORIES,
  COPY_CHANNELS,
  COPY_OBJECTIVES,
  COPY_STATUS_LABELS,
  COPY_STATUS_STYLES,
  COPY_TONES,
  COPY_WORKSHOPS,
  COPY_FEATURED_COURSES,
  COPY_FRAMEWORK_AIDA,
  CopyCategory,
  CopyRequest,
  CopyStatus,
  getCampaignLabel,
  getCategoryLabel,
} from '@/lib/copy-center'
import type { UserProfile } from '@/lib/marketing-types'

type CopyForm = {
  title: string
  category: CopyCategory
  product_topic: string
  campaign_month: string
  channels: string[]
  objective: string
  tone: string
  audience: string
  brief: string
  call_to_action: string
  needs_image: boolean
  image_brief: string
  assigned_to: string
  reviewer_id: string
  due_date: string
}


type WhatsAppAsset = {
  id: string
  asset_type: 'image' | 'video' | string
  public_url: string | null
  storage_path: string
  version: number
  status: string
  metadata?: { mime_type?: string } | null
}

type WhatsAppDestination = {
  groupCode: string
  groupName: string
  groupJid: string
  purpose: string
  defaultSendTime1: string | null
  defaultSendTime2: string | null
  instanceCode: string | null
  instanceName: string | null
  phoneLabel: string | null
}

type WhatsAppSchedule = {
  campaignCode: string
  timezone: string
  sendTime1: string
  sendTime2: string
  nextSlot: string | null
}

type WhatsAppPreview = {
  asset: WhatsAppAsset | null
  destination: WhatsAppDestination | null
  schedule: WhatsAppSchedule | null
}

type LiveGroupOption = {
  code: string
  name: string
  groupJid: string
  purpose?: string | null
}

type LiveSettingsPreview = {
  live_date: string
  is_extraordinary: boolean
  template_id: string
  selected_group_codes: string[]
  timezone: string
}

type LivePreview = {
  settings: LiveSettingsPreview | null
  groups: LiveGroupOption[]
  asset: WhatsAppAsset | null
}

type LiveForm = {
  topic: string
  liveDate: string
  extraordinary: boolean
  templateId: string
  selectedGroupCodes: string[]
}

const EMPTY_FORM: CopyForm = {
  title: '',
  category: 'social',
  product_topic: '',
  campaign_month: '',
  channels: ['Facebook', 'Instagram'],
  objective: 'Venta',
  tone: 'Directo y profesional',
  audience: 'Dueños de taller y técnicos automotrices',
  brief: '',
  call_to_action: 'Solicita información para apartar tu lugar.',
  needs_image: false,
  image_brief: '',
  assigned_to: '',
  reviewer_id: '',
  due_date: '',
}

const STATUS_FILTERS: Array<{ value: 'all' | CopyStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Solicitudes' },
  { value: 'draft', label: 'Borradores' },
  { value: 'review', label: 'Por revisar' },
  { value: 'changes_requested', label: 'Con cambios' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'published', label: 'Publicados' },
]

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function isWorkshopCopy(item: Pick<CopyRequest, 'product_topic'> | null | undefined) {
  return Boolean(item && normalizeName(item.product_topic || '').includes('workshop'))
}

function isCourseCopy(item: Pick<CopyRequest, 'category' | 'product_topic'> | null | undefined) {
  return Boolean(item && item.category === 'course' && !isWorkshopCopy(item))
}

function isLiveCopy(item: Pick<CopyRequest, 'objective' | 'product_topic' | 'title'> | null | undefined) {
  if (!item) return false
  return item.objective === 'Invitación a live'
    || normalizeName(item.product_topic || '').includes('live')
    || normalizeName(item.title || '').includes('live')
}

function nextWednesdayDate() {
  const now = new Date()
  const day = now.getDay()
  let delta = (3 - day + 7) % 7
  if (delta === 0 && now.getHours() >= 10) delta = 7
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta)
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isWednesdayDate(value: string) {
  if (!value) return false
  return new Date(`${value}T12:00:00Z`).getUTCDay() === 3
}

function isOctoberWorkshop(item: Pick<CopyRequest, 'campaign_month' | 'product_topic'> | null | undefined) {
  if (!item) return false
  return item.campaign_month === '2026-10' && normalizeName(item.product_topic || '').includes('workshop')
}

function isOctoberWorkshopWarmup(item: Pick<CopyRequest, 'campaign_month' | 'product_topic' | 'channels' | 'objective'> | null | undefined) {
  if (!item) return false
  return isOctoberWorkshop(item)
    && item.channels.includes('WhatsApp')
    && item.objective === 'Calentamiento'
}

function isOctoberJF017Course(item: Pick<CopyRequest, 'campaign_month' | 'product_topic'> | null | undefined) {
  if (!item) return false
  const topic = normalizeName(item.product_topic || '')
  return item.campaign_month === '2026-10' && topic.includes('jf017') && !topic.includes('workshop')
}

function isOctoberJF017Warmup(item: Pick<CopyRequest, 'campaign_month' | 'product_topic' | 'channels' | 'objective'> | null | undefined) {
  if (!item) return false
  return isOctoberJF017Course(item)
    && item.channels.includes('WhatsApp')
    && item.objective === 'Calentamiento'
}

function isScheduledWhatsAppWarmup(item: Pick<CopyRequest, 'campaign_month' | 'product_topic' | 'channels' | 'objective'> | null | undefined) {
  return isOctoberWorkshopWarmup(item) || isOctoberJF017Warmup(item)
}

function userName(users: UserProfile[], id: string | null) {
  if (!id) return 'Sin asignar'
  return users.find((item) => item.id === id)?.full_name || 'Usuario'
}

function displayDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}

function displayScheduledDateTime(value: string | null, timeZone = 'America/Mexico_City') {
  if (!value) return 'Se asignará al aprobar'
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(new Date(value))
}

export default function CopyCenterDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const { user, loading: userLoading } = useCurrentUser()
  const [requests, setRequests] = useState<CopyRequest[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CopyStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | CopyCategory>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selected, setSelected] = useState<CopyRequest | null>(null)
  const [form, setForm] = useState<CopyForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [working, setWorking] = useState(false)
  const [editorCopy, setEditorCopy] = useState('')
  const [feedback, setFeedback] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [whatsAppPreview, setWhatsAppPreview] = useState<WhatsAppPreview | null>(null)
  const [whatsAppLoading, setWhatsAppLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [showLiveCreate, setShowLiveCreate] = useState(false)
  const [liveGroups, setLiveGroups] = useState<LiveGroupOption[]>([])
  const [liveGroupsLoading, setLiveGroupsLoading] = useState(false)
  const [livePreview, setLivePreview] = useState<LivePreview | null>(null)
  const [liveForm, setLiveForm] = useState<LiveForm>({
    topic: '',
    liveDate: nextWednesdayDate(),
    extraordinary: false,
    templateId: '1',
    selectedGroupCodes: [],
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [requestsResult, usersResult] = await Promise.all([
      supabase.from('copy_requests').select('*').order('updated_at', { ascending: false }),
      supabase.from('user_profiles').select('*').order('full_name', { ascending: true }),
    ])

    if (requestsResult.error) {
      setError(
        requestsResult.error.code === '42P01'
          ? 'Primero ejecuta Migracion_Centro_Copys.sql en Supabase del CRM.'
          : requestsResult.error.message,
      )
    } else {
      setRequests((requestsResult.data || []) as CopyRequest[])
    }

    if (!usersResult.error) setUsers((usersResult.data || []) as UserProfile[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (!user) return
    const initialLoad = window.setTimeout(() => {
      void loadData()
    }, 0)

    const channel = supabase
      .channel('copy-center-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'copy_requests' }, () => {
        void loadData()
      })
      .subscribe()

    return () => {
      window.clearTimeout(initialLoad)
      void supabase.removeChannel(channel)
    }
  }, [loadData, supabase, user])

  const openRequest = (item: CopyRequest) => {
    setEditorCopy(item.final_copy || item.generated_copy || '')
    setFeedback(item.feedback || '')
    setSelected(item)
  }

  const currentUserEmail = user?.email?.trim().toLowerCase() || ''
  const currentUserName = normalizeName(user?.full_name || '')
  const currentIsMarcos = currentUserEmail === 'marcosc@eagles.com' || currentUserName.includes('marcos')
  const currentIsVictoria = currentUserName.includes('victoria')
  const currentIsUrsula = currentUserName.includes('ursula') || currentUserEmail === 'ursula@eagles.com'

  const visibleRequests = useMemo(() => {
    if (!user) return []
    // Las reglas personales tienen prioridad aunque el perfil tenga role=admin.
    if (currentIsUrsula) return requests.filter((item) => isLiveCopy(item))
    if (currentIsMarcos) return requests.filter((item) => isWorkshopCopy(item))
    if (currentIsVictoria) return requests.filter((item) => isCourseCopy(item))
    if (user.role === 'admin') return requests
    return requests
  }, [currentIsMarcos, currentIsUrsula, currentIsVictoria, requests, user])

  const counts = useMemo(() => ({
    active: visibleRequests.filter((item) => !['approved', 'published'].includes(item.status)).length,
    review: visibleRequests.filter((item) => item.status === 'review').length,
    approved: visibleRequests.filter((item) => item.status === 'approved').length,
    image: visibleRequests.filter((item) => item.needs_image && item.status !== 'published').length,
  }), [visibleRequests])

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeName(query.trim())
    return visibleRequests.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const searchable = normalizeName(`${item.title} ${item.product_topic} ${item.brief}`)
      return matchesStatus && matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [categoryFilter, query, statusFilter, visibleRequests])

  const openCreate = (
    campaignMonth?: string,
    presetTopic?: string,
    presetBrief?: string,
    preferredOwner?: 'marcos',
    workshopMode?: 'social' | 'warmup',
    presetCta?: string,
  ) => {
    const victoria = users.find((item) => normalizeName(item.full_name).includes('victoria'))
    const marcos = users.find((item) => (
      normalizeName(item.full_name).includes('marcos')
      || item.email.trim().toLowerCase() === 'marcosc@eagles.com'
    ))
    const campaign = COPY_CAMPAIGNS.find((item) => item.value === campaignMonth)
    const firstTopic = presetTopic || campaign?.topics[0] || ''
    const isWorkshopPreset = preferredOwner === 'marcos' && Boolean(presetTopic)
    const normalizedFirstTopic = normalizeName(firstTopic)
    const isCoursePreset = Boolean(firstTopic)
      && !isWorkshopPreset
      && (Boolean(campaign) || normalizedFirstTopic.includes('curso') || normalizedFirstTopic.includes('jf017'))
    const isSocialWorkshop = isWorkshopPreset && workshopMode === 'social'
    const isWarmupWorkshop = isWorkshopPreset && workshopMode === 'warmup'

    setForm({
      ...EMPTY_FORM,
      category: campaign ? 'course' : EMPTY_FORM.category,
      channels: isSocialWorkshop
        ? ['Facebook', 'Instagram', 'TikTok']
        : isWarmupWorkshop
          ? ['WhatsApp']
          : isWorkshopPreset
            ? ['WhatsApp']
            : EMPTY_FORM.channels,
      objective: isSocialWorkshop ? 'Venta' : isWarmupWorkshop ? 'Calentamiento' : isWorkshopPreset ? 'Calentamiento' : EMPTY_FORM.objective,
      tone: isWarmupWorkshop ? 'Cercano y educativo' : EMPTY_FORM.tone,
      call_to_action: presetCta || EMPTY_FORM.call_to_action,
      needs_image: Boolean(isWorkshopPreset),
      image_brief: isWorkshopPreset
        ? 'Usar la línea gráfica de Eagles Digital Solutions para la Workshop: negro, amarillo, blanco y gris metálico; transmisión automática convencional como elemento principal; diseño limpio, técnico y de alto contraste.'
        : '',
      campaign_month: campaign?.value || EMPTY_FORM.campaign_month,
      product_topic: firstTopic,
      title: firstTopic ? `Copys · ${firstTopic}` : '',
      brief: presetBrief || '',
      assigned_to: isWorkshopPreset
        ? marcos?.id || user?.id || ''
        : isCoursePreset
          ? victoria?.id || ''
          : '',
      reviewer_id: isWorkshopPreset
        ? marcos?.id || user?.id || ''
        : isCoursePreset
          ? victoria?.id || ''
          : '',
    })
    setShowAdvanced(false)
    setShowCreate(true)
  }

  const openFeaturedCourse = (
    course: (typeof COPY_FEATURED_COURSES)[number],
    mode: 'social' | 'warmup',
  ) => {
    const victoria = users.find((item) => normalizeName(item.full_name).includes('victoria'))
    const isWarmup = mode === 'warmup'

    setForm({
      ...EMPTY_FORM,
      category: 'course',
      campaign_month: course.campaignMonth,
      product_topic: course.topic,
      title: `Copys · ${course.topic}`,
      channels: isWarmup ? ['WhatsApp'] : ['Facebook', 'Instagram', 'TikTok'],
      objective: isWarmup ? 'Calentamiento' : 'Venta',
      tone: isWarmup ? 'Cercano y educativo' : 'Directo y profesional',
      audience: 'Técnicos, transmisionistas y dueños de taller',
      brief: course.brief,
      call_to_action: isWarmup ? course.warmupCta : course.socialCta,
      needs_image: true,
      image_brief: course.imageBrief,
      assigned_to: victoria?.id || '',
      reviewer_id: victoria?.id || '',
      due_date: '',
    })
    setShowAdvanced(false)
    setShowCreate(true)
  }

  const loadLiveGroups = useCallback(async () => {
    setLiveGroupsLoading(true)
    try {
      const response = await fetch('/app1/api/live-stream/groups', { cache: 'no-store' })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const raw = await response.text()
        console.error('[LIVE GROUPS] respuesta no JSON', { status: response.status, redirected: response.redirected, url: response.url, raw: raw.slice(0, 180) })
        throw new Error('El endpoint de grupos fue redirigido o no está disponible. Recarga el CRM e inténtalo de nuevo.')
      }
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudieron cargar los grupos.')
      setLiveGroups((payload.groups || []) as LiveGroupOption[])
    } catch (groupsError) {
      setNotice(groupsError instanceof Error ? groupsError.message : 'No se pudieron cargar los grupos de Lives.')
      setLiveGroups([])
    } finally {
      setLiveGroupsLoading(false)
    }
  }, [])

  const openLiveCreate = async (extraordinary = false) => {
    setLiveForm({
      topic: '',
      liveDate: nextWednesdayDate(),
      extraordinary,
      templateId: 'auto',
      selectedGroupCodes: [],
    })
    setShowLiveCreate(true)
    if (!liveGroups.length) await loadLiveGroups()
  }

  const createLiveRequest = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    const topic = liveForm.topic.trim().replace(/^transmisi[oó]n\s+/i, '')
    if (!topic) {
      setNotice('Escribe el tema de la transmisión para el Live.')
      return
    }
    if (!liveForm.liveDate) {
      setNotice('Selecciona la fecha del Live.')
      return
    }
    if (!liveForm.extraordinary && !isWednesdayDate(liveForm.liveDate)) {
      setNotice('El Live normal debe ser miércoles. Usa “Fecha extraordinaria” si será otro día.')
      return
    }
    if (!liveForm.selectedGroupCodes.length) {
      setNotice('Selecciona al menos un grupo de la instancia GRUPOS.')
      return
    }

    setSaving(true)
    setNotice(null)
    try {
      const month = liveForm.liveDate.slice(0, 7)
      const { data: created, error: createError } = await supabase
        .from('copy_requests')
        .insert({
          title: `Live · ${topic}`,
          category: 'social',
          product_topic: `Live · ${topic}`,
          campaign_month: month,
          channels: ['WhatsApp'],
          objective: 'Invitación a live',
          tone: 'Cercano y directo',
          audience: 'Carnalitos, técnicos, transmisionistas y dueños de taller',
          brief: `Live de Eagles Gear Solutions. Fecha: ${liveForm.liveDate}. Tema: Transmisión ${topic}. El copy es fijo; solo cambian tema y fecha.`,
          call_to_action: 'Conéctate al Live desde las redes oficiales de Eagles.',
          needs_image: true,
          image_brief: 'Flyer automático generado por el CRM a partir del tema y la fecha. Usa las plantillas históricas de Lives como base visual; no requiere modelo de imagen ni carga manual.',
          assigned_to: user.id,
          reviewer_id: user.id,
          due_date: liveForm.liveDate,
          requested_by: user.id,
          status: 'pending',
        })
        .select('*')
        .single()

      if (createError || !created) throw createError || new Error('No se pudo crear el Live.')
      const createdRequest = created as CopyRequest

      const configResponse = await fetch(`/app1/api/copy-requests/${createdRequest.id}/live`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          liveDate: liveForm.liveDate,
          isExtraordinary: liveForm.extraordinary,
          templateId: liveForm.templateId,
          selectedGroupCodes: liveForm.selectedGroupCodes,
        }),
      })
      const configPayload = await configResponse.json()
      if (!configResponse.ok) throw new Error(configPayload.error || 'No se pudo guardar la configuración del Live.')

      const generateResponse = await fetch(`/app1/api/copy-requests/${createdRequest.id}/generate`, { method: 'POST' })
      const generatePayload = await generateResponse.json()
      if (!generateResponse.ok) throw new Error(generatePayload.error || 'No se pudo crear el copy del Live.')

      const generatedRequest = generatePayload.request as CopyRequest
      setSelected(generatedRequest)
      setEditorCopy(generatedRequest.final_copy || generatedRequest.generated_copy || '')
      setFeedback('')
      setShowLiveCreate(false)
      setNotice('Live listo. El flyer se generó automáticamente con tema y fecha. Úrsula solo revisa, aprueba y programa.')
      await loadData()
    } catch (liveError) {
      setNotice(liveError instanceof Error ? liveError.message : 'No se pudo crear el Live.')
    } finally {
      setSaving(false)
    }
  }

  const loadLivePreview = useCallback(async (copyId: string) => {
    try {
      const response = await fetch(`/app1/api/copy-requests/${copyId}/live`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo cargar la programación del Live.')
      setLivePreview(payload as LivePreview)
    } catch (previewError) {
      setLivePreview(null)
      setNotice(previewError instanceof Error ? previewError.message : 'No se pudo cargar la programación del Live.')
    }
  }, [])

  const approveAndScheduleLive = async () => {
    if (!selected) return
    if (!whatsAppPreview?.asset?.public_url) {
      setNotice('No se encontró el flyer automático. Regénéralo antes de programar.')
      return
    }

    setWorking(true)
    setNotice(null)
    try {
      const response = await fetch(`/app1/api/copy-requests/${selected.id}/live`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'approve-schedule' }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo programar el Live.')

      const updated = payload.request as CopyRequest
      setSelected(updated)
      setEditorCopy(updated.final_copy || updated.generated_copy || '')
      setNotice(`Live aprobado: ${payload.summary?.groups || 0} grupos · ${payload.summary?.deliveries || 0} envíos programados en GRUPOS.`)
      await Promise.all([loadData(), loadWhatsAppPreview(selected.id), loadLivePreview(selected.id)])
    } catch (liveError) {
      setNotice(liveError instanceof Error ? liveError.message : 'No se pudo programar el Live.')
    } finally {
      setWorking(false)
    }
  }

  const regenerateLiveFlyer = async () => {
    if (!selected || !isLiveCopy(selected)) return
    setWorking(true)
    setNotice(null)
    try {
      const response = await fetch(`/app1/api/copy-requests/${selected.id}/live`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-flyer', templateId: 'next' }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo regenerar el flyer.')
      await Promise.all([loadWhatsAppPreview(selected.id), loadLivePreview(selected.id)])
      setNotice(`Flyer actualizado automáticamente · Plantilla ${payload.settings?.template_id || ''}.`)
    } catch (flyerError) {
      setNotice(flyerError instanceof Error ? flyerError.message : 'No se pudo regenerar el flyer.')
    } finally {
      setWorking(false)
    }
  }

  const applyCampaign = (campaignMonth: string) => {
    const campaign = COPY_CAMPAIGNS.find((item) => item.value === campaignMonth)
    const firstTopic = campaign?.topics[0] || ''
    setForm((current) => ({
      ...current,
      campaign_month: campaignMonth,
      category: campaign ? 'course' : current.category,
      product_topic: firstTopic || current.product_topic,
    }))
  }

  const toggleChannel = (channel: string) => {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }))
  }

  const createRequest = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (!form.product_topic.trim()) {
      setNotice('Escribe el producto, curso o tema del copy.')
      return
    }
    if (form.channels.length === 0) {
      setNotice('Selecciona al menos un canal.')
      return
    }

    setSaving(true)
    setNotice(null)
    const productTopic = form.product_topic.trim()
    const normalizedTopic = normalizeName(productTopic)
    const inferredCategory: CopyCategory = /curso|capacitacion|workshop|seminario/.test(normalizedTopic)
      ? 'course'
      : /taller|diagnostico|reparacion|falla|servicio/.test(normalizedTopic)
        ? 'taller'
        : 'social'
    const category = showAdvanced ? form.category : inferredCategory
    const isWorkshopRequest = normalizeName(productTopic).includes('workshop')
    const isCourseRequest = category === 'course' && !isWorkshopRequest
    const marcosProfile = users.find((item) => (
      normalizeName(item.full_name).includes('marcos')
      || item.email.trim().toLowerCase() === 'marcosc@eagles.com'
    ))
    const victoriaProfile = users.find((item) => normalizeName(item.full_name).includes('victoria'))
    const effectiveAssignedTo = isWorkshopRequest
      ? marcosProfile?.id || user.id
      : isCourseRequest
        ? victoriaProfile?.id || form.assigned_to || null
        : form.assigned_to || null
    const effectiveReviewerId = isWorkshopRequest
      ? marcosProfile?.id || user.id
      : isCourseRequest
        ? victoriaProfile?.id || form.reviewer_id || null
        : form.reviewer_id || null
    const automaticTitle = `${form.objective} · ${productTopic}`
    const automaticBrief = form.brief.trim()
      || `Crear un copy de ${form.objective.toLowerCase()} para ${productTopic}. Usar solamente información confirmada y omitir cualquier dato faltante.`
    const { data: created, error: createError } = await supabase
      .from('copy_requests')
      .insert({
        ...form,
        title: automaticTitle,
        category,
        product_topic: productTopic,
        brief: automaticBrief,
        campaign_month: form.campaign_month || null,
        audience: form.audience.trim() || null,
        call_to_action: form.call_to_action.trim() || null,
        image_brief: form.needs_image ? form.image_brief.trim() || null : null,
        assigned_to: effectiveAssignedTo,
        reviewer_id: effectiveReviewerId,
        due_date: (
          form.campaign_month === '2026-10'
          && form.channels.includes('WhatsApp')
          && form.objective === 'Calentamiento'
          && (
            normalizeName(productTopic).includes('workshop')
            || normalizeName(productTopic).includes('jf017')
          )
        ) ? null : form.due_date || null,
        requested_by: user.id,
        status: 'pending',
      })
      .select('*')
      .single()

    if (createError) {
      setSaving(false)
      setNotice(createError.message)
      return
    }

    setShowCreate(false)
    const createdRequest = created as CopyRequest
    setSelected(createdRequest)
    setEditorCopy('')
    setFeedback('')

    try {
      const response = await fetch(`/app1/api/copy-requests/${createdRequest.id}/generate`, {
        method: 'POST',
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo generar el borrador.')
      const generatedRequest = payload.request as CopyRequest
      setSelected(generatedRequest)
      setEditorCopy(generatedRequest.final_copy || generatedRequest.generated_copy || '')
      setNotice(isOctoberWorkshop(generatedRequest) ? 'Borrador listo. La revisión de esta Workshop queda contigo.' : isCourseCopy(generatedRequest) ? 'Borrador listo. Victoria lleva este curso de inicio a fin.' : 'Borrador listo.')
    } catch (generateError) {
      setNotice(
        `La solicitud quedó guardada. ${generateError instanceof Error ? generateError.message : 'No se pudo generar el borrador.'}`,
      )
    } finally {
      setSaving(false)
      await loadData()
    }
  }

  const patchRequest = async (id: string, values: Partial<CopyRequest>) => {
    const { error: updateError } = await supabase.from('copy_requests').update(values).eq('id', id)
    if (updateError) throw updateError
    await loadData()
    setSelected((current) => current?.id === id ? { ...current, ...values } : current)
  }

  const generateDraft = async () => {
    if (!selected) return
    setWorking(true)
    setNotice(null)
    try {
      const response = await fetch(`/app1/api/copy-requests/${selected.id}/generate`, {
        method: 'POST',
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo generar el borrador.')
      setSelected(payload.request as CopyRequest)
      setEditorCopy(payload.request.final_copy || payload.request.generated_copy || '')
      setNotice(isLiveCopy(selected) || isOctoberWorkshop(selected) || isCourseCopy(selected) ? 'Borrador generado. Revísalo y envíalo a tu propia revisión.' : 'Borrador generado. Revísalo antes de enviarlo a aprobación.')
      await loadData()
    } catch (generateError) {
      setNotice(generateError instanceof Error ? generateError.message : 'No se pudo generar el borrador.')
    } finally {
      setWorking(false)
    }
  }

  const saveDraft = async () => {
    if (!selected || !editorCopy.trim()) return
    setWorking(true)
    try {
      await patchRequest(selected.id, {
        final_copy: editorCopy.trim(),
        status: 'draft',
        generation_error: null,
      })
      setNotice('Borrador guardado.')
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'No se pudo guardar.')
    } finally {
      setWorking(false)
    }
  }

  const sendToReview = async () => {
    if (!selected || !editorCopy.trim()) return
    setWorking(true)
    try {
      await patchRequest(selected.id, {
        final_copy: editorCopy.trim(),
        status: 'review',
        feedback: null,
      })
      setNotice(isLiveCopy(selected) || isOctoberWorkshop(selected) || isCourseCopy(selected) ? 'Copy enviado a tu revisión.' : 'Copy enviado a revisión.')
    } catch (sendError) {
      setNotice(sendError instanceof Error ? sendError.message : 'No se pudo enviar a revisión.')
    } finally {
      setWorking(false)
    }
  }

  const reviewRequest = async (status: 'approved' | 'changes_requested') => {
    if (!selected) return
    if (status === 'changes_requested' && !feedback.trim()) {
      setNotice('Escribe los cambios necesarios.')
      return
    }
    setWorking(true)
    try {
      await patchRequest(selected.id, {
        final_copy: editorCopy.trim() || selected.final_copy,
        status,
        feedback: status === 'changes_requested' ? feedback.trim() : null,
        reviewed_at: new Date().toISOString(),
      })
      setNotice(status === 'approved' ? 'Copy aprobado.' : 'Cambios solicitados.')
    } catch (reviewError) {
      setNotice(reviewError instanceof Error ? reviewError.message : 'No se pudo actualizar la revisión.')
    } finally {
      setWorking(false)
    }
  }

  const loadWhatsAppPreview = useCallback(async (copyId: string) => {
    setWhatsAppLoading(true)
    try {
      const response = await fetch(`/app1/api/copy-requests/${copyId}/whatsapp`, {
        method: 'GET',
        cache: 'no-store',
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo cargar la vista previa de WhatsApp.')
      setWhatsAppPreview(payload as WhatsAppPreview)
    } catch (previewError) {
      setWhatsAppPreview(null)
      setNotice(previewError instanceof Error ? previewError.message : 'No se pudo cargar la vista previa de WhatsApp.')
    } finally {
      setWhatsAppLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selected?.id) {
      setWhatsAppPreview(null)
      return
    }
    void loadWhatsAppPreview(selected.id)
  }, [loadWhatsAppPreview, selected?.id])

  useEffect(() => {
    if (!selected?.id || !isLiveCopy(selected)) {
      setLivePreview(null)
      return
    }
    void loadLivePreview(selected.id)
  }, [loadLivePreview, selected?.id])

  const uploadWhatsAppMedia = async (file: File | null) => {
    if (!selected || !file) return
    setImageUploading(true)
    setNotice(null)

    try {
      const prepareResponse = await fetch(`/app1/api/copy-requests/${selected.id}/whatsapp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare-upload',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      })
      const preparePayload = await prepareResponse.json()
      if (!prepareResponse.ok) throw new Error(preparePayload.error || 'No se pudo preparar la carga.')

      const upload = preparePayload.upload as {
        bucket: string
        storagePath: string
        token: string
        version: number
        assetType: 'image' | 'video'
      }

      const { error: storageError } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.storagePath, upload.token, file, {
          contentType: file.type,
          cacheControl: '3600',
        })

      if (storageError) throw storageError

      const finalizeResponse = await fetch(`/app1/api/copy-requests/${selected.id}/whatsapp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize-upload',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          storagePath: upload.storagePath,
          version: upload.version,
          assetType: upload.assetType,
        }),
      })
      const finalizePayload = await finalizeResponse.json()
      if (!finalizeResponse.ok) throw new Error(finalizePayload.error || 'No se pudo guardar el contenido.')

      await loadWhatsAppPreview(selected.id)
      setNotice(isOctoberWorkshop(selected) || isCourseCopy(selected)
        ? `${upload.assetType === 'video' ? 'Video' : 'Imagen'} guardado. Ya puedes revisarlo en la vista previa de WhatsApp.`
        : 'Contenido guardado. La persona revisora ya puede verlo en la vista previa de WhatsApp.')
    } catch (uploadError) {
      setNotice(uploadError instanceof Error ? uploadError.message : 'No se pudo subir el contenido.')
    } finally {
      setImageUploading(false)
    }
  }


  const approveAndScheduleWhatsApp = async () => {
    if (!selected) return
    if (!editorCopy.trim()) {
      setNotice('El copy está vacío.')
      return
    }
    if (!whatsAppPreview?.asset?.public_url) {
      setNotice('Primero sube una imagen o video para aprobar.')
      return
    }

    setWorking(true)
    setNotice(null)
    try {
      const response = await fetch(`/app1/api/copy-requests/${selected.id}/whatsapp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'approve-schedule',
          caption: editorCopy.trim(),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo programar el calentamiento.')

      const updated = payload.request as CopyRequest
      setSelected(updated)
      setEditorCopy(updated.final_copy || updated.generated_copy || '')
      setNotice(`Aprobado y programado para ${displayScheduledDateTime(payload.schedule?.scheduledAt || null, payload.schedule?.timezone || 'America/Mexico_City')} · ${payload.destination?.groupName || 'Prueba Victoria'}.`)
      await Promise.all([loadData(), loadWhatsAppPreview(selected.id)])
    } catch (sendError) {
      setNotice(sendError instanceof Error ? sendError.message : 'No se pudo programar el calentamiento.')
    } finally {
      setWorking(false)
    }
  }

  const markPublished = async () => {
    if (!selected) return
    setWorking(true)
    try {
      await patchRequest(selected.id, {
        status: 'published',
        published_at: new Date().toISOString(),
      })
      setNotice('Copy marcado como publicado.')
    } catch (publishError) {
      setNotice(publishError instanceof Error ? publishError.message : 'No se pudo actualizar.')
    } finally {
      setWorking(false)
    }
  }

  const copyText = async () => {
    const text = editorCopy || selected?.final_copy || selected?.generated_copy
    if (!text) return
    await navigator.clipboard.writeText(text)
    setNotice('Copy copiado al portapapeles.')
  }

  if (userLoading) {
    return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  if (!user) return <p className="py-12 text-center">No autenticado.</p>

  const isAdmin = user.role === 'admin'
  // Un admin genérico ve todo; Marcos, Victoria y Úrsula conservan su alcance personal aunque su rol técnico sea admin.
  const isUnrestrictedAdmin = isAdmin && !currentIsMarcos && !currentIsVictoria && !currentIsUrsula
  const selectedIsWorkshop = isWorkshopCopy(selected)
  const selectedIsCourse = isCourseCopy(selected)
  const selectedIsLive = isLiveCopy(selected)
  const selectedIsWorkshopWarmup = isOctoberWorkshopWarmup(selected)
  const selectedIsJF017Warmup = isOctoberJF017Warmup(selected)
  const selectedIsScheduledWarmup = isScheduledWhatsAppWarmup(selected)
  const canWorkSelected = Boolean(selected && (
    selectedIsLive
      ? currentIsUrsula
      : isUnrestrictedAdmin
        || (selectedIsWorkshop
          ? currentIsMarcos
          : selectedIsCourse
            ? currentIsVictoria
            : selected.assigned_to === user.id || selected.requested_by === user.id)
  ))
  const canReviewSelected = Boolean(selected && (
    selectedIsLive
      ? currentIsUrsula
      : isUnrestrictedAdmin
        || (selectedIsWorkshop
          ? currentIsMarcos
          : selectedIsCourse
            ? currentIsVictoria
            : selected.reviewer_id === user.id)
  ))
  const normalizedFormTopic = normalizeName(form.product_topic || '')
  const formIsScheduledWarmup = form.campaign_month === '2026-10'
    && form.channels.includes('WhatsApp')
    && form.objective === 'Calentamiento'
    && (normalizedFormTopic.includes('workshop') || normalizedFormTopic.includes('jf017'))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border-color bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            <Sparkles size={16} /> Flujo creativo
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Centro de Copys</h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground/60">{currentIsMarcos ? 'Workshop: tú generas, revisas, apruebas y programas.' : currentIsVictoria ? 'Cursos: tú generas, revisas, apruebas y programas los calentamientos.' : currentIsUrsula ? 'Lives: tú generas, revisas, apruebas y programas los envíos multigrupo.' : 'Ollama redacta y cada campaña usa su responsable asignado.'}</p>
        </div>
        {(isUnrestrictedAdmin || (!currentIsMarcos && !currentIsVictoria && !currentIsUrsula)) && <button onClick={() => openCreate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-semibold text-white transition hover:bg-brand-orange-dark">
          <Plus size={19} /> Nueva solicitud
        </button>}
      </header>

      {!currentIsUrsula && (
        <section className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-500">Metodología automática</p>
              <h2 className="mt-1 font-bold text-foreground">AIDA · Atracción → Interés → Deseo → Acción</h2>
              <p className="mt-1 text-xs text-foreground/55">El CRM envía esta estructura a la IA automáticamente. Tú solo revisas que el copy se sienta natural y no repetitivo.</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {COPY_FRAMEWORK_AIDA.map((stage, index) => (
                <div key={`${stage.label}-${index}`} className="rounded-lg border border-violet-500/20 bg-surface px-2 py-2">
                  <span className="block text-sm font-black text-violet-500">{stage.key}</span>
                  <span className="block text-[10px] font-semibold text-foreground/60">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-4 py-3 text-sm text-foreground">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Cerrar aviso"><X size={17} /></button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'En proceso', value: counts.active, icon: Clock3 },
          { label: 'Por revisar', value: counts.review, icon: UserRoundCheck },
          { label: 'Aprobados', value: counts.approved, icon: CheckCircle2 },
          { label: 'Piezas multimedia', value: counts.image, icon: ImageIcon },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border-color bg-surface p-4">
            <div className="flex items-center justify-between text-foreground/55"><span className="text-xs font-semibold uppercase tracking-wider">{label}</span><Icon size={18} /></div>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border-color bg-surface p-5">
        <div className="mb-4 flex items-center gap-2"><CalendarDays className="text-brand-orange" size={20} /><h2 className="font-bold">Copys rápidos</h2></div>
        {(isUnrestrictedAdmin || currentIsMarcos) && COPY_WORKSHOPS.map((workshop) => (
          <div
            key={workshop.id}
            className="mb-3 rounded-xl border border-brand-orange/50 bg-brand-orange/10 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider text-brand-orange">{workshop.label}</span>
                <span className="mt-1 block font-bold text-foreground">{workshop.topic}</span>
                <span className="mt-1 block text-xs text-foreground/55">2 y 3 de octubre · Online vía Zoom · 17 USD</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openCreate(workshop.campaignMonth, workshop.topic, workshop.brief, workshop.owner, 'social', workshop.socialCta)}
                  className="rounded-lg border border-brand-orange/40 bg-surface px-3 py-2 text-sm font-semibold text-brand-orange transition hover:border-brand-orange"
                >
                  Copy para redes
                </button>
                <button
                  type="button"
                  onClick={() => openCreate(workshop.campaignMonth, workshop.topic, workshop.brief, workshop.owner, 'warmup', workshop.warmupCta)}
                  className="rounded-lg bg-brand-orange px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-orange-dark"
                >
                  Calentamiento WhatsApp
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-foreground/55">
              <img src={workshop.groupIcon} alt="Icono del grupo" className="size-10 rounded-lg object-cover" />
              <img src={workshop.referenceFlyer} alt="Flyer inicial" className="size-10 rounded-lg object-cover" />
              <span>Metodología AIDA automática · referencias visuales guardadas · calentamientos programables a las 10:00 AM y 5:00 PM.</span>
            </div>
          </div>
        ))}
        {(isUnrestrictedAdmin || currentIsVictoria) && COPY_FEATURED_COURSES.map((course) => (
          <div
            key={course.id}
            className="mb-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider text-fuchsia-500">{course.label}</span>
                <span className="mt-1 block font-bold text-foreground">{course.topic}</span>
                <span className="mt-1 block text-xs text-foreground/55">16 y 17 de octubre · 100% online · $2,997 MXN · Aparta $1,500</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openFeaturedCourse(course, 'social')}
                  className="rounded-lg border border-fuchsia-500/40 bg-surface px-3 py-2 text-sm font-semibold text-fuchsia-500 transition hover:border-fuchsia-500"
                >
                  Copy para redes
                </button>
                <button
                  type="button"
                  onClick={() => openFeaturedCourse(course, 'warmup')}
                  className="rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                >
                  Calentamiento WhatsApp
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-foreground/55">
              <img src={course.referenceFlyer} alt="Flyer Curso CVT JF017" className="size-12 rounded-lg object-cover" />
              <span>Victoria lleva el flujo completo · metodología AIDA automática · el destino de WhatsApp se toma de la campaña · admite imagen o video.</span>
            </div>
          </div>
        ))}
        {currentIsUrsula && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-sky-500">Lives · Úrsula</span>
                <span className="mt-1 block font-bold text-foreground">Live de los miércoles</span>
                <p className="mt-2 max-w-2xl text-sm text-foreground/55">Copy fijo: solo cambian tema y fecha. Tú generas, revisas, apruebas y programas. Martes se distribuye 8:30–10:30 AM y el día del Live 8:00–10:00 AM en los grupos seleccionados de la instancia GRUPOS.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void openLiveCreate(false)} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">
                  <Plus size={16} className="mr-1 inline" /> Nuevo Live miércoles
                </button>
                <button type="button" onClick={() => void openLiveCreate(true)} className="rounded-lg border border-sky-500/50 bg-surface px-4 py-2.5 text-sm font-semibold text-sky-500 transition hover:border-sky-500">
                  <CalendarDays size={16} className="mr-1 inline" /> Fecha extraordinaria
                </button>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {LIVE_STREAM_TEMPLATES.map((template) => (
                <div key={template.id} className="min-w-24 rounded-lg border border-sky-500/20 bg-surface p-2">
                  <img src={template.src} alt={template.label} className="h-28 w-20 rounded object-cover" />
                  <p className="mt-1 text-[10px] text-foreground/50">{template.id}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-foreground/45">Las 5 plantillas que enviaste son PNG planos: se integran como referencias visuales, pero no contienen capas editables recuperables. Para edición automática exacta necesitamos el Canva/PSD editable.</p>
          </div>
        )}
        {isUnrestrictedAdmin && <div className="grid gap-3 md:grid-cols-3">
          {COPY_CAMPAIGNS.filter((campaign) => campaign.showQuick !== false).map((campaign) => (
            <button key={campaign.value} onClick={() => openCreate(campaign.value)} className="rounded-xl border border-border-color p-4 text-left transition hover:border-brand-orange/60 hover:bg-brand-orange/5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-orange">{campaign.label}</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground/75">
                {campaign.topics.map((topic) => <li key={topic}>• {topic.replace('Curso presencial ', '')}</li>)}
              </ul>
            </button>
          ))}
        </div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-color bg-surface">
        <div className="flex flex-col gap-3 border-b border-border-color p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema, producto o brief" className="min-h-11 w-full rounded-xl border border-border-color bg-background pl-10 pr-3 text-sm outline-none focus:border-brand-orange" />
          </div>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | CopyCategory)} className="min-h-11 rounded-xl border border-border-color bg-background px-3 text-sm">
            <option value="all">Todas las categorías</option>
            {COPY_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button onClick={() => void loadData()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-color px-4 text-sm font-medium hover:bg-foreground/5"><RefreshCw size={16} /> Actualizar</button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-border-color px-4 py-3">
          {STATUS_FILTERS.map((item) => (
            <button key={item.value} onClick={() => setStatusFilter(item.value)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === item.value ? 'bg-foreground text-background' : 'bg-foreground/5 text-foreground/65 hover:bg-foreground/10'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-foreground/60"><Loader2 className="animate-spin" size={20} /> Cargando copys...</div>
        ) : error ? (
          <div className="p-8 text-center"><p className="font-semibold text-rose-500">{error}</p><p className="mt-2 text-sm text-foreground/55">El ZIP incluye el archivo SQL que debes ejecutar.</p></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center"><MessageSquareText className="mx-auto text-foreground/25" size={42} /><h3 className="mt-3 font-bold">No hay solicitudes aquí</h3><p className="mt-1 text-sm text-foreground/55">Crea la primera o cambia los filtros.</p></div>
        ) : (
          <div className="divide-y divide-border-color">
            {filtered.map((item) => (
              <button key={item.id} onClick={() => openRequest(item)} className="grid w-full gap-3 p-4 text-left transition hover:bg-foreground/[0.03] sm:grid-cols-[1fr_auto] sm:items-center lg:grid-cols-[minmax(0,1.5fr)_minmax(130px,.65fr)_minmax(130px,.65fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${COPY_STATUS_STYLES[item.status]}`}>{COPY_STATUS_LABELS[item.status]}</span>
                    {item.needs_image && <span className="inline-flex items-center gap-1 text-xs text-foreground/55"><ImageIcon size={13} /> Multimedia</span>}
                  </div>
                  <h3 className="mt-2 truncate font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 truncate text-sm text-foreground/55">{item.product_topic} · {item.channels.join(', ')}</p>
                </div>
                <div className="text-sm"><p className="text-xs text-foreground/45">Responsable</p><p className="mt-1 font-medium">{userName(users, item.assigned_to)}</p></div>
                <div className="text-sm"><p className="text-xs text-foreground/45">Revisión</p><p className="mt-1 font-medium">{userName(users, item.reviewer_id)}</p></div>
                <div className="text-sm sm:text-right"><p className="text-xs text-foreground/45">{isLiveCopy(item) || isScheduledWhatsAppWarmup(item) ? 'Programación' : 'Entrega'}</p><p className="mt-1 font-medium">{isLiveCopy(item) ? `${displayDate(item.due_date)} · multigrupo` : isScheduledWhatsAppWarmup(item) && !item.due_date ? 'Al aprobar · 10 AM / 5 PM' : displayDate(item.due_date)}</p></div>
              </button>
            ))}
          </div>
        )}
      </section>

      {showLiveCreate && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowLiveCreate(false) }}>
          <form onSubmit={createLiveRequest} className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-border-color bg-surface p-5 shadow-2xl sm:max-w-3xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Lives · Úrsula</p>
                <h2 className="mt-1 text-2xl font-bold">{liveForm.extraordinary ? 'Fecha extraordinaria' : 'Nuevo Live del miércoles'}</h2>
                <p className="mt-1 text-sm text-foreground/55">Solo define tema, fecha y grupos. El CRM genera automáticamente el flyer y el copy fijo.</p>
              </div>
              <button type="button" onClick={() => setShowLiveCreate(false)} className="rounded-lg p-2 hover:bg-foreground/5"><X /></button>
            </div>

            <div className="space-y-5">
              <label>
                <span className="mb-1.5 block text-sm font-semibold">Tema de la transmisión *</span>
                <input autoFocus value={liveForm.topic} onChange={(event) => setLiveForm((current) => ({ ...current, topic: event.target.value }))} placeholder="Ej. DQ250 -02E -0D9" className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3 outline-none focus:border-sky-500" />
                <span className="mt-1 block text-xs text-foreground/45">El CRM agregará “Transmisión” automáticamente al copy.</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-semibold">Fecha del Live *</span>
                  <input type="date" value={liveForm.liveDate} onChange={(event) => setLiveForm((current) => ({ ...current, liveDate: event.target.value }))} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3 outline-none focus:border-sky-500" />
                </label>
                <div className="rounded-xl border border-border-color p-3 text-sm">
                  <p className="font-semibold">Tipo de fecha</p>
                  <p className="mt-1 text-foreground/55">{liveForm.extraordinary ? 'Extraordinaria · puede ser cualquier día.' : 'Normal · solamente miércoles.'}</p>
                  {!liveForm.extraordinary && liveForm.liveDate && !isWednesdayDate(liveForm.liveDate) && <p className="mt-2 text-xs font-semibold text-rose-500">Selecciona un miércoles o usa Fecha extraordinaria.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-4 text-sm">
                <p className="font-bold text-sky-600 dark:text-sky-400">Flyer automático · $0 en modelos de imagen</p>
                <p className="mt-1 text-foreground/60">Úrsula solo captura tema y fecha. El CRM toma una de las 5 plantillas históricas, cubre el texto anterior y coloca automáticamente transmisión, fecha y 11 AM. No usa OpenAI, Midjourney ni APIs de imagen de pago.</p>
              </div>

              <div className="rounded-xl border border-border-color p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Grupos de WhatsApp · instancia GRUPOS *</p>
                    <p className="mt-1 text-xs text-foreground/45">Selecciona los grupos que recibirán el recordatorio del día anterior y el aviso del día del Live.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setLiveForm((current) => ({ ...current, selectedGroupCodes: liveGroups.map((group) => group.code) }))} className="rounded-lg border border-border-color px-3 py-1.5 text-xs font-semibold">Todos</button>
                    <button type="button" onClick={() => setLiveForm((current) => ({ ...current, selectedGroupCodes: [] }))} className="rounded-lg border border-border-color px-3 py-1.5 text-xs font-semibold">Ninguno</button>
                  </div>
                </div>
                {liveGroupsLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-foreground/55"><Loader2 className="animate-spin" size={16} /> Cargando grupos...</div>
                ) : liveGroups.length === 0 ? (
                  <p className="mt-4 text-sm text-rose-500">No hay grupos de Lives activos disponibles en la instancia GRUPOS.</p>
                ) : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {liveGroups.map((group) => {
                      const checked = liveForm.selectedGroupCodes.includes(group.code)
                      return (
                        <label key={group.code} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checked ? 'border-sky-500/50 bg-sky-500/5' : 'border-border-color'}`}>
                          <input type="checkbox" checked={checked} onChange={() => setLiveForm((current) => ({ ...current, selectedGroupCodes: checked ? current.selectedGroupCodes.filter((code) => code !== group.code) : [...current.selectedGroupCodes, group.code] }))} className="mt-1" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{group.name}</span>
                            <span className="block truncate text-xs text-foreground/45">{group.groupJid}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 text-sm">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Programación automática multigrupo</p>
                <p className="mt-1 text-foreground/60">Día anterior: 8:30–10:30 AM · Día del Live: 8:00–10:00 AM · Hora México. Los grupos se distribuyen durante la ventana para evitar ráfagas.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowLiveCreate(false)} className="min-h-11 rounded-xl border border-border-color px-4 font-semibold">Cancelar</button>
              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />} Crear Live</button>
            </div>
          </form>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowCreate(false) }}>
          <form onSubmit={createRequest} className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-border-color bg-surface p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Solicitud rápida</p><h2 className="mt-1 text-2xl font-bold">Escribe una frase</h2><p className="mt-1 text-sm text-foreground/55">Lo demás se completa automáticamente.</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 hover:bg-foreground/5"><X /></button></div>

            <div className="space-y-5">
              <label><span className="mb-1.5 block text-sm font-semibold">¿Qué necesitas anunciar? *</span><textarea autoFocus value={form.product_topic} onChange={(event) => setForm({ ...form, product_topic: event.target.value })} rows={3} placeholder="Ej. Promocionar el curso 6L80 y 6L90 de septiembre" className="w-full rounded-xl border border-border-color bg-background p-3 text-base outline-none focus:border-brand-orange" /></label>

              <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-500">Se generará con AIDA</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {COPY_FRAMEWORK_AIDA.map((stage, index) => (
                    <div key={`${stage.label}-create-${index}`} className="rounded-lg bg-surface px-2.5 py-2">
                      <p className="text-xs font-bold text-foreground">{stage.key} · {stage.label}</p>
                      <p className="mt-1 text-[11px] leading-4 text-foreground/50">{stage.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border-color">
                <button type="button" onClick={() => setShowAdvanced((current) => !current)} className="flex min-h-11 w-full items-center justify-between px-4 text-sm font-semibold"><span>Agregar detalles <span className="font-normal text-foreground/45">(opcional)</span></span><ChevronDown size={18} className={`transition ${showAdvanced ? 'rotate-180' : ''}`} /></button>
                {showAdvanced && <div className="grid gap-4 border-t border-border-color p-4 sm:grid-cols-2">
                  <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Tipo</legend><div className="grid grid-cols-3 gap-2">{COPY_CATEGORIES.map((item) => <button type="button" key={item.value} onClick={() => setForm({ ...form, category: item.value })} className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${form.category === item.value ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-border-color text-foreground/60'}`}>{item.value === 'social' ? 'Redes' : item.value === 'taller' ? 'Taller' : 'Curso'}</button>)}</div></fieldset>
                  <label><span className="mb-1.5 block text-sm font-semibold">Objetivo</span><select value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3">{COPY_OBJECTIVES.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span className="mb-1.5 block text-sm font-semibold">Campaña</span><select value={form.campaign_month} onChange={(event) => applyCampaign(event.target.value)} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3"><option value="">Sin campaña</option>{COPY_CAMPAIGNS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Canales</legend><div className="flex flex-wrap gap-2">{COPY_CHANNELS.map((channel) => <button type="button" key={channel} onClick={() => toggleChannel(channel)} className={`rounded-full border px-3 py-2 text-sm ${form.channels.includes(channel) ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-border-color text-foreground/60'}`}>{form.channels.includes(channel) && <Check className="mr-1 inline" size={14} />}{channel}</button>)}</div></fieldset>
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Dato que no debe faltar</span><textarea value={form.brief} onChange={(event) => setForm({ ...form, brief: event.target.value })} rows={2} placeholder="Fechas, precio o modalidad confirmada" className="w-full rounded-xl border border-border-color bg-background p-3" /></label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-color p-3 sm:col-span-2"><input type="checkbox" checked={form.needs_image} onChange={(event) => setForm({ ...form, needs_image: event.target.checked })} className="size-5 accent-orange-500" /><span className="font-semibold">También necesito imagen</span></label>
                  {form.needs_image && <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Qué debe verse</span><textarea value={form.image_brief} onChange={(event) => setForm({ ...form, image_brief: event.target.value })} rows={2} placeholder="Ej. transmisión 6L80, fondo de taller, formato vertical" className="w-full rounded-xl border border-border-color bg-background p-3" /></label>}
                  {formIsScheduledWarmup ? (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 sm:col-span-2">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Programación automática</p>
                      <p className="mt-1 text-xs text-foreground/60">No necesitas elegir fecha de entrega. Al aprobar, el CRM toma el siguiente espacio libre: 10:00 AM o 5:00 PM (hora de México).</p>
                    </div>
                  ) : (
                    <label><span className="mb-1.5 block text-sm font-semibold">Fecha de entrega</span><input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3" /></label>
                  )}
                  <label><span className="mb-1.5 block text-sm font-semibold">Responsable</span><select value={form.assigned_to} onChange={(event) => setForm({ ...form, assigned_to: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3"><option value="">Sin asignar</option>{users.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></label>
                  <label><span className="mb-1.5 block text-sm font-semibold">Revisora</span><select value={form.reviewer_id} onChange={(event) => setForm({ ...form, reviewer_id: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3"><option value="">Sin revisora</option>{users.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></label>
                  <label><span className="mb-1.5 block text-sm font-semibold">Tono</span><select value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3">{COPY_TONES.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span className="mb-1.5 block text-sm font-semibold">Audiencia</span><input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3" /></label>
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Llamado a la acción</span><input value={form.call_to_action} onChange={(event) => setForm({ ...form, call_to_action: event.target.value })} className="min-h-11 w-full rounded-xl border border-border-color bg-background px-3" /></label>
                </div>}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCreate(false)} className="min-h-11 rounded-xl border border-border-color px-5 font-semibold">Cancelar</button><button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} {saving ? 'Creando borrador...' : 'Crear borrador'}</button></div>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !working) setSelected(null) }}>
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-border-color bg-surface shadow-2xl sm:max-w-5xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-color bg-surface p-5"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${COPY_STATUS_STYLES[selected.status]}`}>{COPY_STATUS_LABELS[selected.status]}</span><span className="text-xs text-foreground/50">{getCategoryLabel(selected.category)} · {getCampaignLabel(selected.campaign_month)}</span></div><h2 className="mt-2 text-xl font-bold sm:text-2xl">{selected.title}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-foreground/5"><X /></button></div>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <div className="rounded-xl border border-border-color bg-background p-4"><p className="text-xs font-bold uppercase tracking-wider text-foreground/45">Brief</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/75">{selected.brief}</p></div>
                {selected.generation_error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">{selected.generation_error}</div>}
                <label><span className="mb-2 block text-sm font-bold">Copy de trabajo</span><textarea value={editorCopy} onChange={(event) => setEditorCopy(event.target.value)} disabled={!canWorkSelected && !canReviewSelected} rows={13} placeholder="Genera el borrador con n8n o escribe aquí el copy manualmente." className="w-full rounded-xl border border-border-color bg-background p-4 leading-6 outline-none focus:border-brand-orange disabled:opacity-70" /></label>

                {selected.channels.includes('WhatsApp') && (
                  <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#efeae2] text-slate-900 shadow-sm dark:bg-[#111b21] dark:text-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Vista previa WhatsApp · Programación</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedIsWorkshop ? 'Solo tú apruebas esta Workshop. El envío queda en cola para 10:00 AM o 5:00 PM.' : selectedIsJF017Warmup ? 'Victoria prepara, revisa y aprueba. El destino y horario se toman de la campaña configurada.' : 'Esto es lo que la persona revisora aprobará antes del envío.'}</p>
                      </div>
                      {selectedIsLive ? (
                        <span className="rounded-full bg-sky-600/10 px-2.5 py-1 text-xs font-bold text-sky-700 dark:text-sky-400">
                          GRUPOS · {livePreview?.groups?.length || 0} grupos
                        </span>
                      ) : whatsAppPreview?.destination && (
                        <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {whatsAppPreview.destination.groupName}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      {whatsAppLoading ? (
                        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Cargando preview...</div>
                      ) : whatsAppPreview?.asset?.public_url ? (
                        <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md dark:bg-[#202c33]">
                          {whatsAppPreview.asset.asset_type === 'video' ? (
                            <video
                              src={whatsAppPreview.asset.public_url}
                              controls
                              playsInline
                              className="max-h-[520px] w-full bg-black object-contain"
                            >
                              Tu navegador no puede reproducir este video.
                            </video>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={whatsAppPreview.asset.public_url} alt="Flyer del calentamiento" className="max-h-[520px] w-full object-contain bg-black" />
                          )}
                          <p className="whitespace-pre-wrap p-3 text-sm leading-5">{editorCopy || selected.final_copy || selected.generated_copy || 'Sin copy todavía.'}</p>
                        </div>
                      ) : (
                        <div className="mx-auto flex min-h-56 max-w-md flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center dark:border-slate-700 dark:bg-white/5">
                          <ImageIcon size={34} className="text-slate-400" />
                          <p className="mt-3 font-bold">{selectedIsLive ? 'Falta el flyer final del Live' : 'Falta el contenido del calentamiento'}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedIsLive ? 'Selecciona una de las plantillas como referencia y sube aquí el flyer final. Los PNG recibidos no tienen capas editables.' : 'Puedes subir un flyer o un video corto.'}</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedIsLive && (
                            <button type="button" disabled={working} onClick={() => void regenerateLiveFlyer()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-500 bg-white px-4 text-sm font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 dark:bg-white/5 dark:text-sky-300">
                              {working ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                              Cambiar estilo del flyer
                            </button>
                          )}
                          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-white/5 dark:text-slate-100">
                            {imageUploading ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
                            {selectedIsLive ? 'Reemplazar manualmente' : whatsAppPreview?.asset ? 'Cambiar contenido' : 'Subir imagen o video'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                              className="hidden"
                              disabled={imageUploading || (!canWorkSelected && !canReviewSelected)}
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null
                                void uploadWhatsAppMedia(file)
                                event.currentTarget.value = ''
                              }}
                            />
                          </label>
                        </div>

                        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                          {selectedIsLive ? (
                            <>
                              <p><strong>Instancia:</strong> GRUPOS</p>
                              <p><strong>Grupos:</strong> {livePreview?.groups?.length || 0}</p>
                              <p><strong>Fecha:</strong> {displayDate(livePreview?.settings?.live_date || selected.due_date)}</p>
                              <p><strong>Flyer:</strong> Automático · Plantilla {livePreview?.settings?.template_id || '—'}</p>
                              <p><strong>Día anterior:</strong> 8:30–10:30 AM</p>
                              <p><strong>Día del Live:</strong> 8:00–10:00 AM</p>
                            </>
                          ) : (
                            <>
                              <p><strong>Instancia:</strong> {whatsAppPreview?.destination?.instanceName || 'WORKSHOP'}</p>
                              <p><strong>Grupo:</strong> {whatsAppPreview?.destination?.groupName || 'PRUEBA_VICTORIA'}</p>
                              {selectedIsScheduledWarmup && <p><strong>Próximo espacio:</strong> {displayScheduledDateTime(whatsAppPreview?.schedule?.nextSlot || null, whatsAppPreview?.schedule?.timezone || 'America/Mexico_City')}</p>}
                              {selectedIsScheduledWarmup && <p><strong>Horarios:</strong> 10:00 AM · 5:00 PM</p>}
                            </>
                          )}
                          {whatsAppPreview?.asset && <p><strong>Contenido:</strong> {whatsAppPreview.asset.asset_type === 'video' ? 'Video' : 'Imagen'}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(selected.status === 'review' || selected.status === 'changes_requested') && <label><span className="mb-2 block text-sm font-bold">Comentarios de revisión</span><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} disabled={!canReviewSelected && selected.status === 'review'} rows={3} placeholder="Indica qué debe corregirse antes de aprobar." className="w-full rounded-xl border border-border-color bg-background p-3 outline-none focus:border-brand-orange disabled:opacity-70" /></label>}
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border-color p-4 text-sm"><p className="text-xs font-bold uppercase tracking-wider text-foreground/45">Asignación</p><dl className="mt-3 space-y-3"><div><dt className="text-foreground/45">Responsable</dt><dd className="font-semibold">{userName(users, selected.assigned_to)}</dd></div><div><dt className="text-foreground/45">Revisión</dt><dd className="font-semibold">{selectedIsLive ? 'Úrsula · exclusiva Lives' : selectedIsWorkshop ? 'Marcos · exclusiva Workshop' : selectedIsCourse ? 'Victoria · exclusiva Cursos' : userName(users, selected.reviewer_id)}</dd></div><div><dt className="text-foreground/45">{selectedIsLive || selectedIsScheduledWarmup ? 'Programación' : 'Entrega'}</dt><dd className="font-semibold">{selectedIsLive ? 'Día anterior 8:30–10:30 · Día del Live 8:00–10:00' : selectedIsScheduledWarmup && !selected.due_date ? 'Se asigna al aprobar · 10 AM / 5 PM' : displayDate(selected.due_date)}</dd></div></dl></div>
                {!selectedIsLive && <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-500">Checklist AIDA</p>
                  <div className="mt-3 space-y-2">
                    {COPY_FRAMEWORK_AIDA.map((stage, index) => (
                      <div key={`${stage.label}-review-${index}`} className="flex gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-black text-violet-500">{stage.key}</span>
                        <span><strong>{stage.label}:</strong> <span className="text-foreground/55">{stage.description}</span></span>
                      </div>
                    ))}
                  </div>
                </div>}
                <div className="rounded-xl border border-border-color p-4 text-sm"><p className="text-xs font-bold uppercase tracking-wider text-foreground/45">Publicación</p><dl className="mt-3 space-y-3"><div><dt className="text-foreground/45">Tema</dt><dd className="font-semibold">{selected.product_topic}</dd></div><div><dt className="text-foreground/45">Canales</dt><dd className="font-semibold">{selected.channels.join(', ')}</dd></div><div><dt className="text-foreground/45">Objetivo</dt><dd className="font-semibold">{selected.objective}</dd></div><div><dt className="text-foreground/45">Tono</dt><dd className="font-semibold">{selected.tone}</dd></div></dl></div>
                {selected.needs_image && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><p className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300"><ImageIcon size={17} /> {selectedIsLive ? 'Flyer automático' : 'Requiere contenido visual'}</p><p className="mt-2 text-foreground/65">{selected.image_brief || 'Sin indicaciones visuales.'}</p>{selected.image_prompt && <p className="mt-3 border-t border-amber-500/20 pt-3 text-xs text-foreground/55">Prompt: {selected.image_prompt}</p>}</div>}
              </aside>
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border-color bg-surface p-4">
              {(selected.generated_copy || selected.final_copy || editorCopy) && <button onClick={() => void copyText()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color px-4 font-semibold"><Clipboard size={17} /> Copiar</button>}
              {canWorkSelected && ['pending', 'changes_requested'].includes(selected.status) && <button disabled={working} onClick={() => void generateDraft()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 font-semibold text-white disabled:opacity-50">{working ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />} Generar con IA</button>}
              {canWorkSelected && ['pending', 'draft', 'changes_requested'].includes(selected.status) && <button disabled={working || !editorCopy.trim()} onClick={() => void saveDraft()} className="min-h-11 rounded-xl border border-brand-orange px-4 font-semibold text-brand-orange disabled:opacity-50">Guardar borrador</button>}
              {canWorkSelected && ['draft', 'changes_requested'].includes(selected.status) && <button disabled={working || !editorCopy.trim()} onClick={() => void sendToReview()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-orange px-4 font-semibold text-white disabled:opacity-50"><Send size={17} /> {selectedIsLive || selectedIsWorkshop || selectedIsCourse ? 'Enviar a mi revisión' : 'Enviar a revisión'}</button>}
              {canReviewSelected && selected.status === 'review' && <button disabled={working} onClick={() => void reviewRequest('changes_requested')} className="min-h-11 rounded-xl border border-rose-500 px-4 font-semibold text-rose-500 disabled:opacity-50">Solicitar cambios</button>}
              {canReviewSelected && selected.status === 'review' && selectedIsLive && <button disabled={working || !whatsAppPreview?.asset?.public_url || !livePreview?.groups?.length} onClick={() => void approveAndScheduleLive()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17} /> Aprobar y programar Live</button>}
              {canReviewSelected && selected.status === 'review' && !selectedIsLive && selectedIsScheduledWarmup && <button disabled={working || !whatsAppPreview?.asset?.public_url} onClick={() => void approveAndScheduleWhatsApp()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17} /> Aprobar y programar</button>}
              {canReviewSelected && selected.status === 'review' && !selectedIsLive && !selectedIsScheduledWarmup && <button disabled={working} onClick={() => void reviewRequest('approved')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17} /> Aprobar</button>}
              {(canReviewSelected || canWorkSelected) && selected.status === 'approved' && <button disabled={working} onClick={() => void markPublished()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 font-semibold text-white disabled:opacity-50"><Check size={17} /> Marcar publicado</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
