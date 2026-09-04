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

  const counts = useMemo(() => ({
    active: requests.filter((item) => !['approved', 'published'].includes(item.status)).length,
    review: requests.filter((item) => item.status === 'review').length,
    approved: requests.filter((item) => item.status === 'approved').length,
    image: requests.filter((item) => item.needs_image && item.status !== 'published').length,
  }), [requests])

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeName(query.trim())
    return requests.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const searchable = normalizeName(`${item.title} ${item.product_topic} ${item.brief}`)
      return matchesStatus && matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [categoryFilter, query, requests, statusFilter])

  const openCreate = (
    campaignMonth?: string,
    presetTopic?: string,
    presetBrief?: string,
    preferredOwner?: 'marcos',
    workshopMode?: 'social' | 'warmup',
    presetCta?: string,
  ) => {
    const ursula = users.find((item) => normalizeName(item.full_name).includes('ursula'))
    const victoria = users.find((item) => normalizeName(item.full_name).includes('victoria'))
    const marcos = users.find((item) => (
      normalizeName(item.full_name).includes('marcos')
      || item.email.trim().toLowerCase() === 'marcosc@eagles.com'
    ))
    const campaign = COPY_CAMPAIGNS.find((item) => item.value === campaignMonth)
    const firstTopic = presetTopic || campaign?.topics[0] || ''
    const isWorkshopPreset = preferredOwner === 'marcos' && Boolean(presetTopic)
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
      assigned_to: preferredOwner === 'marcos'
        ? marcos?.id || user?.id || ''
        : ursula?.id || '',
      reviewer_id: isWorkshopPreset ? (marcos?.id || user?.id || '') : (victoria?.id || ''),
    })
    setShowAdvanced(false)
    setShowCreate(true)
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
        assigned_to: form.assigned_to || null,
        reviewer_id: (form.campaign_month === '2026-10' && normalizeName(productTopic).includes('workshop'))
          ? users.find((item) => item.email.trim().toLowerCase() === 'marcosc@eagles.com')?.id || user.id
          : form.reviewer_id || null,
        due_date: (
          form.campaign_month === '2026-10'
          && normalizeName(productTopic).includes('workshop')
          && form.channels.includes('WhatsApp')
          && form.objective === 'Calentamiento'
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
      setNotice(isOctoberWorkshop(generatedRequest) ? 'Borrador listo. La revisión de esta Workshop queda contigo.' : 'Borrador listo. Úrsula solo necesita revisarlo y enviarlo a Victoria.')
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
      setNotice(isOctoberWorkshop(selected) ? 'Borrador generado. Revísalo y envíalo a tu aprobación.' : 'Borrador generado. Revísalo antes de enviarlo a Victoria.')
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
      setNotice(isOctoberWorkshop(selected) ? 'Copy enviado a tu revisión.' : 'Copy enviado a revisión de Victoria.')
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
      setNotice(isOctoberWorkshop(selected)
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
  const canWorkSelected = Boolean(selected && (isAdmin || selected.assigned_to === user.id || selected.requested_by === user.id))
  const selectedIsWorkshop = isOctoberWorkshop(selected)
  const selectedIsWorkshopWarmup = isOctoberWorkshopWarmup(selected)
  const currentUserEmail = user.email.trim().toLowerCase()
  const canReviewSelected = Boolean(selected && (
    selectedIsWorkshop
      ? currentUserEmail === 'marcosc@eagles.com'
      : isAdmin || selected.reviewer_id === user.id
  ))
  const formIsWorkshopWarmup = form.campaign_month === '2026-10'
    && normalizeName(form.product_topic || '').includes('workshop')
    && form.channels.includes('WhatsApp')
    && form.objective === 'Calentamiento'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border-color bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            <Sparkles size={16} /> Flujo creativo
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Centro de Copys</h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground/60">Marcos y Úrsula piden el copy en una frase · Ollama redacta · cada campaña usa su revisor asignado.</p>
        </div>
        <button onClick={() => openCreate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-semibold text-white transition hover:bg-brand-orange-dark">
          <Plus size={19} /> Nueva solicitud
        </button>
      </header>

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
        {COPY_WORKSHOPS.map((workshop) => (
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
              <span>Referencias visuales guardadas · calentamientos programables automáticamente a las 10:00 AM y 5:00 PM.</span>
            </div>
          </div>
        ))}
        <div className="grid gap-3 md:grid-cols-3">
          {COPY_CAMPAIGNS.map((campaign) => (
            <button key={campaign.value} onClick={() => openCreate(campaign.value)} className="rounded-xl border border-border-color p-4 text-left transition hover:border-brand-orange/60 hover:bg-brand-orange/5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-orange">{campaign.label}</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground/75">
                {campaign.topics.map((topic) => <li key={topic}>• {topic.replace('Curso presencial ', '')}</li>)}
              </ul>
            </button>
          ))}
        </div>
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
                <div className="text-sm sm:text-right"><p className="text-xs text-foreground/45">{isOctoberWorkshopWarmup(item) ? 'Programación' : 'Entrega'}</p><p className="mt-1 font-medium">{isOctoberWorkshopWarmup(item) && !item.due_date ? 'Al aprobar · 10 AM / 5 PM' : displayDate(item.due_date)}</p></div>
              </button>
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowCreate(false) }}>
          <form onSubmit={createRequest} className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-border-color bg-surface p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Solicitud rápida</p><h2 className="mt-1 text-2xl font-bold">Escribe una frase</h2><p className="mt-1 text-sm text-foreground/55">Lo demás se completa automáticamente.</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 hover:bg-foreground/5"><X /></button></div>

            <div className="space-y-5">
              <label><span className="mb-1.5 block text-sm font-semibold">¿Qué necesitas anunciar? *</span><textarea autoFocus value={form.product_topic} onChange={(event) => setForm({ ...form, product_topic: event.target.value })} rows={3} placeholder="Ej. Promocionar el curso 6L80 y 6L90 de septiembre" className="w-full rounded-xl border border-border-color bg-background p-3 text-base outline-none focus:border-brand-orange" /></label>

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
                  {formIsWorkshopWarmup ? (
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
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedIsWorkshop ? 'Solo tú apruebas esta Workshop. El envío queda en cola para 10:00 AM o 5:00 PM.' : 'Esto es lo que la persona revisora aprobará antes del envío.'}</p>
                      </div>
                      {whatsAppPreview?.destination && (
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
                          <p className="mt-3 font-bold">Falta el contenido del calentamiento</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Puedes subir un flyer o un video corto. Después conectaremos aquí la generación visual por IA/layers.</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-white/5 dark:text-slate-100">
                          {imageUploading ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
                          {whatsAppPreview?.asset ? 'Cambiar contenido' : 'Subir imagen o video'}
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

                        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                          <p><strong>Instancia:</strong> {whatsAppPreview?.destination?.instanceName || 'WORKSHOP'}</p>
                          <p><strong>Grupo:</strong> {whatsAppPreview?.destination?.groupName || 'PRUEBA_VICTORIA'}</p>
                          {selectedIsWorkshopWarmup && <p><strong>Próximo espacio:</strong> {displayScheduledDateTime(whatsAppPreview?.schedule?.nextSlot || null, whatsAppPreview?.schedule?.timezone || 'America/Mexico_City')}</p>}
                          {selectedIsWorkshopWarmup && <p><strong>Horarios:</strong> 10:00 AM · 5:00 PM</p>}
                          {whatsAppPreview?.asset && <p><strong>Contenido:</strong> {whatsAppPreview.asset.asset_type === 'video' ? 'Video' : 'Imagen'}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(selected.status === 'review' || selected.status === 'changes_requested') && <label><span className="mb-2 block text-sm font-bold">Comentarios de revisión</span><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} disabled={!canReviewSelected && selected.status === 'review'} rows={3} placeholder="Indica qué debe corregirse antes de aprobar." className="w-full rounded-xl border border-border-color bg-background p-3 outline-none focus:border-brand-orange disabled:opacity-70" /></label>}
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border-color p-4 text-sm"><p className="text-xs font-bold uppercase tracking-wider text-foreground/45">Asignación</p><dl className="mt-3 space-y-3"><div><dt className="text-foreground/45">Responsable</dt><dd className="font-semibold">{userName(users, selected.assigned_to)}</dd></div><div><dt className="text-foreground/45">Revisión</dt><dd className="font-semibold">{selectedIsWorkshop ? 'Marcos · exclusiva Workshop' : userName(users, selected.reviewer_id)}</dd></div><div><dt className="text-foreground/45">{selectedIsWorkshopWarmup ? 'Programación' : 'Entrega'}</dt><dd className="font-semibold">{selectedIsWorkshopWarmup && !selected.due_date ? 'Se asigna al aprobar · 10 AM / 5 PM' : displayDate(selected.due_date)}</dd></div></dl></div>
                <div className="rounded-xl border border-border-color p-4 text-sm"><p className="text-xs font-bold uppercase tracking-wider text-foreground/45">Publicación</p><dl className="mt-3 space-y-3"><div><dt className="text-foreground/45">Tema</dt><dd className="font-semibold">{selected.product_topic}</dd></div><div><dt className="text-foreground/45">Canales</dt><dd className="font-semibold">{selected.channels.join(', ')}</dd></div><div><dt className="text-foreground/45">Objetivo</dt><dd className="font-semibold">{selected.objective}</dd></div><div><dt className="text-foreground/45">Tono</dt><dd className="font-semibold">{selected.tone}</dd></div></dl></div>
                {selected.needs_image && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><p className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300"><ImageIcon size={17} /> Requiere contenido visual</p><p className="mt-2 text-foreground/65">{selected.image_brief || 'Sin indicaciones visuales.'}</p>{selected.image_prompt && <p className="mt-3 border-t border-amber-500/20 pt-3 text-xs text-foreground/55">Prompt: {selected.image_prompt}</p>}</div>}
              </aside>
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border-color bg-surface p-4">
              {(selected.generated_copy || selected.final_copy || editorCopy) && <button onClick={() => void copyText()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color px-4 font-semibold"><Clipboard size={17} /> Copiar</button>}
              {canWorkSelected && ['pending', 'changes_requested'].includes(selected.status) && <button disabled={working} onClick={() => void generateDraft()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 font-semibold text-white disabled:opacity-50">{working ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />} Generar con IA</button>}
              {canWorkSelected && ['pending', 'draft', 'changes_requested'].includes(selected.status) && <button disabled={working || !editorCopy.trim()} onClick={() => void saveDraft()} className="min-h-11 rounded-xl border border-brand-orange px-4 font-semibold text-brand-orange disabled:opacity-50">Guardar borrador</button>}
              {canWorkSelected && ['draft', 'changes_requested'].includes(selected.status) && <button disabled={working || !editorCopy.trim()} onClick={() => void sendToReview()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-orange px-4 font-semibold text-white disabled:opacity-50"><Send size={17} /> {selectedIsWorkshop ? 'Enviar a mi revisión' : 'Enviar a Victoria'}</button>}
              {canReviewSelected && selected.status === 'review' && <button disabled={working} onClick={() => void reviewRequest('changes_requested')} className="min-h-11 rounded-xl border border-rose-500 px-4 font-semibold text-rose-500 disabled:opacity-50">Solicitar cambios</button>}
              {canReviewSelected && selected.status === 'review' && selectedIsWorkshopWarmup && <button disabled={working || !whatsAppPreview?.asset?.public_url} onClick={() => void approveAndScheduleWhatsApp()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17} /> Aprobar y programar</button>}
              {canReviewSelected && selected.status === 'review' && !selectedIsWorkshopWarmup && <button disabled={working} onClick={() => void reviewRequest('approved')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17} /> Aprobar</button>}
              {(canReviewSelected || canWorkSelected) && selected.status === 'approved' && <button disabled={working} onClick={() => void markPublished()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 font-semibold text-white disabled:opacity-50"><Check size={17} /> Marcar publicado</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
