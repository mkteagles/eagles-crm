import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  LIVE_STREAM_COPY_TUESDAY,
  LIVE_STREAM_COPY_WEDNESDAY,
  type CopyRequest,
} from '@/lib/copy-center'

export const maxDuration = 60

const LIVE_CAMPAIGN_CODE = 'LIVE_STREAM'
const LIVE_TIMEZONE = 'America/Mexico_City'

type LiveSettings = {
  copy_request_ref: string
  live_date: string
  is_extraordinary: boolean
  template_id: string
  selected_group_codes: string[]
  timezone: string
}

type GroupRow = {
  id: string
  code: string
  name: string
  group_jid: string
  instance_id: string
  whatsapp_instances: {
    code: string
    instance_name: string
    base_url: string
  } | null
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function isLiveCopy(item: Pick<CopyRequest, 'objective' | 'product_topic' | 'title'>) {
  return item.objective === 'Invitación a live'
    || normalizeText(item.product_topic || '').includes('live')
    || normalizeText(item.title || '').includes('live')
}

function cleanLiveTopic(value: string) {
  return value
    .replace(/^live\s*[·:\-–—]?\s*/i, '')
    .replace(/^transmisi[oó]n\s+/i, '')
    .trim()
}

function isWednesday(dateText: string) {
  const date = new Date(`${dateText}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.getUTCDay() === 3
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function localDateTimeToUtc(dateText: string, hour: number, minute: number, timeZone: string) {
  const [year, month, day] = dateText.split('-').map(Number)
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

  for (let i = 0; i < 4; i += 1) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(guess)

    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0)
    const representedAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), 0)
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
    const delta = desiredAsUtc - representedAsUtc
    if (delta === 0) break
    guess = new Date(guess.getTime() + delta)
  }

  return guess
}

function distributedOffsets(count: number) {
  if (count <= 1) return [0]
  const maxSlot = 24 // 0..24 => 120 minutes, grid de 5 minutos
  return Array.from({ length: count }, (_, index) => {
    const slot = Math.round((index * maxSlot) / (count - 1))
    return slot * 5
  })
}

function withOffset(dateText: string, startHour: number, startMinute: number, offsetMinutes: number, timeZone: string) {
  const total = startHour * 60 + startMinute + offsetMinutes
  return localDateTimeToUtc(dateText, Math.floor(total / 60), total % 60, timeZone)
}

async function getContext(id: string) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, { status: 401 }) }
  }

  const [{ data: request, error: requestError }, { data: profile }] = await Promise.all([
    supabase.from('copy_requests').select('*').eq('id', id).maybeSingle(),
    supabase.from('user_profiles').select('role,email,full_name').eq('id', authData.user.id).maybeSingle(),
  ])

  if (requestError || !request) {
    return { error: NextResponse.json({ error: 'No se encontró la solicitud de Live.' }, { status: 404 }) }
  }

  const item = request as CopyRequest
  const email = String(profile?.email || authData.user.email || '').trim().toLowerCase()
  const name = normalizeText(String(profile?.full_name || ''))
  const isUrsula = email === 'ursula@eagles.com' || name.includes('ursula')
  const allowed = isLiveCopy(item) && isUrsula
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Este flujo de Lives es exclusivo de Úrsula.' }, { status: 403 }) }
  }

  return { supabase, userId: authData.user.id, item, isUrsula }
}

async function getSelectedAsset(admin: ReturnType<typeof createAdminClient>, copyId: string) {
  const { data, error } = await admin
    .from('marketing_copy_assets')
    .select('id,asset_type,public_url,metadata')
    .eq('copy_request_ref', copyId)
    .in('asset_type', ['image', 'video'])
    .eq('status', 'selected')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

async function getSettings(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await admin
    .from('copy_live_settings')
    .select('*')
    .eq('copy_request_ref', id)
    .maybeSingle()
  if (error) throw error
  return data as LiveSettings | null
}

async function getGroups(admin: ReturnType<typeof createAdminClient>, codes: string[]) {
  if (!codes.length) return [] as GroupRow[]
  const { data, error } = await admin
    .from('whatsapp_groups')
    .select(`
      id,
      code,
      name,
      group_jid,
      instance_id,
      whatsapp_instances!inner (
        code,
        instance_name,
        base_url,
        is_active
      )
    `)
    .in('code', codes)
    .eq('is_active', true)
    .eq('whatsapp_instances.code', 'GRUPOS')
    .eq('whatsapp_instances.is_active', true)
  if (error) throw error
  return (data || []) as unknown as GroupRow[]
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const ctx = await getContext(id)
  if ('error' in ctx) return ctx.error

  try {
    const admin = createAdminClient()
    const settings = await getSettings(admin, id)
    const groups = settings ? await getGroups(admin, settings.selected_group_codes || []) : []
    const asset = await getSelectedAsset(admin, id)

    return NextResponse.json({ settings, groups, asset })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar la configuración del Live.' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const ctx = await getContext(id)
  if ('error' in ctx) return ctx.error

  const payload = await request.json().catch(() => ({})) as {
    action?: string
    liveDate?: string
    isExtraordinary?: boolean
    templateId?: string
    selectedGroupCodes?: string[]
  }

  try {
    const admin = createAdminClient()

    if (payload.action === 'configure') {
      const liveDate = String(payload.liveDate || '').trim()
      const templateId = String(payload.templateId || '1').trim()
      const groupCodes = Array.isArray(payload.selectedGroupCodes)
        ? [...new Set(payload.selectedGroupCodes.map((value) => String(value).trim()).filter(Boolean))]
        : []
      const isExtraordinary = payload.isExtraordinary === true

      if (!/^\d{4}-\d{2}-\d{2}$/.test(liveDate)) {
        return NextResponse.json({ error: 'Selecciona una fecha válida para el Live.' }, { status: 400 })
      }
      if (!isExtraordinary && !isWednesday(liveDate)) {
        return NextResponse.json({ error: 'Los Lives normales solo pueden programarse en miércoles. Usa “Fecha extraordinaria” para otro día.' }, { status: 400 })
      }
      if (!groupCodes.length) {
        return NextResponse.json({ error: 'Selecciona al menos un grupo de la instancia GRUPOS.' }, { status: 400 })
      }

      const groups = await getGroups(admin, groupCodes)
      if (groups.length !== groupCodes.length) {
        return NextResponse.json({ error: 'Uno o más grupos seleccionados no están activos en la instancia GRUPOS.' }, { status: 400 })
      }

      const { data: settings, error } = await admin
        .from('copy_live_settings')
        .upsert({
          copy_request_ref: id,
          live_date: liveDate,
          is_extraordinary: isExtraordinary,
          template_id: templateId,
          selected_group_codes: groupCodes,
          timezone: LIVE_TIMEZONE,
          created_by: ctx.userId,
        }, { onConflict: 'copy_request_ref' })
        .select('*')
        .single()

      if (error) throw error
      return NextResponse.json({ settings, groups })
    }

    if (payload.action !== 'approve-schedule') {
      return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
    }

    const settings = await getSettings(admin, id)
    if (!settings) {
      return NextResponse.json({ error: 'Primero configura la fecha, plantilla y grupos del Live.' }, { status: 400 })
    }
    if (!settings.is_extraordinary && !isWednesday(settings.live_date)) {
      return NextResponse.json({ error: 'La fecha del Live normal debe ser miércoles.' }, { status: 400 })
    }

    const groups = await getGroups(admin, settings.selected_group_codes || [])
    if (!groups.length) {
      return NextResponse.json({ error: 'No hay grupos activos seleccionados para este Live.' }, { status: 400 })
    }

    const asset = await getSelectedAsset(admin, id)
    if (!asset?.public_url) {
      return NextResponse.json({ error: 'Sube el flyer final del Live antes de aprobar y programar.' }, { status: 400 })
    }

    const { data: existing } = await admin
      .from('whatsapp_deliveries')
      .select('id,status')
      .eq('copy_request_ref', id)
      .eq('campaign_code', LIVE_CAMPAIGN_CODE)
      .in('status', ['scheduled', 'sending', 'sent'])
      .limit(1)

    if (existing?.length) {
      return NextResponse.json({ error: 'Este Live ya tiene envíos programados o enviados.' }, { status: 409 })
    }

    const topic = cleanLiveTopic(ctx.item.product_topic)
    const captionDayBefore = LIVE_STREAM_COPY_TUESDAY(topic)
    const captionDayOf = LIVE_STREAM_COPY_WEDNESDAY(topic)
    const dayBefore = addDays(settings.live_date, -1)
    const offsets = distributedOffsets(groups.length)
    const now = new Date()

    const rows: Array<Record<string, unknown>> = []
    groups.forEach((group, index) => {
      const dayBeforeAt = withOffset(dayBefore, 8, 30, offsets[index], settings.timezone)
      const dayOfAt = withOffset(settings.live_date, 8, 0, offsets[index], settings.timezone)

      if (dayBeforeAt > now) {
        rows.push({
          copy_request_ref: id,
          campaign_code: LIVE_CAMPAIGN_CODE,
          asset_id: asset.id,
          instance_id: group.instance_id,
          group_id: group.id,
          caption: captionDayBefore,
          scheduled_at: dayBeforeAt.toISOString(),
          status: 'scheduled',
          approved_by: ctx.userId,
          approved_at: now.toISOString(),
        })
      }

      if (dayOfAt > now) {
        rows.push({
          copy_request_ref: id,
          campaign_code: LIVE_CAMPAIGN_CODE,
          asset_id: asset.id,
          instance_id: group.instance_id,
          group_id: group.id,
          caption: captionDayOf,
          scheduled_at: dayOfAt.toISOString(),
          status: 'scheduled',
          approved_by: ctx.userId,
          approved_at: now.toISOString(),
        })
      }
    })

    if (!rows.length) {
      return NextResponse.json({ error: 'Las ventanas de envío de este Live ya pasaron. Cambia la fecha.' }, { status: 400 })
    }

    const { data: deliveries, error: insertError } = await admin
      .from('whatsapp_deliveries')
      .insert(rows)
      .select('id,group_id,caption,scheduled_at,status')

    if (insertError) throw insertError

    const { data: updated, error: updateError } = await ctx.supabase
      .from('copy_requests')
      .update({
        final_copy: captionDayBefore,
        status: 'approved',
        feedback: null,
        reviewed_at: now.toISOString(),
        due_date: settings.live_date,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    const times = (deliveries || [])
      .map((row) => String(row.scheduled_at))
      .sort()

    return NextResponse.json({
      request: updated,
      deliveries,
      summary: {
        groups: groups.length,
        deliveries: deliveries?.length || 0,
        firstScheduledAt: times[0] || null,
        lastScheduledAt: times[times.length - 1] || null,
        liveDate: settings.live_date,
        extraordinary: settings.is_extraordinary,
        instance: 'GRUPOS',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo configurar o programar el Live.' },
      { status: 500 },
    )
  }
}
