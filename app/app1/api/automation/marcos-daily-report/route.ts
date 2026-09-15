import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const TIMEZONE = 'America/Mexico_City'
const MARCOS_EMAIL = 'marcosc@eagles.com'
const RECIPIENT_DISPLAY = '4495604176'
const RECIPIENT_EVOLUTION = '5214495604176'
const INSTANCE_NAME = 'WORKSHOP'

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getAutomationSecret(request: Request) {
  const header = request.headers.get('x-automation-secret') || ''
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : ''

  return header.trim() || bearer
}

function isAuthorized(request: Request) {
  const expected = process.env.DAILY_REPORT_AUTOMATION_SECRET || ''
  const received = getAutomationSecret(request)

  return Boolean(expected && received && expected === received)
}

function getMexicoDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || ''

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: get('weekday'),
  }
}

function localDateTimeToUtc(
  dateText: string,
  hour: number,
  minute: number,
) {
  const [year, month, day] = dateText.split('-').map(Number)
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

  for (let i = 0; i < 4; i += 1) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(guess)

    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value || 0)

    const representedAsUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      0,
    )

    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
    const delta = desiredAsUtc - representedAsUtc

    if (delta === 0) break
    guess = new Date(guess.getTime() + delta)
  }

  return guess
}

function statusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'Completada'
    case 'in_progress':
      return 'En progreso'
    case 'pending':
      return 'Pendiente'
    case 'rejected':
      return 'Rechazada'
    default:
      return status || 'Sin estado'
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'completed':
      return '✅'
    case 'in_progress':
      return '🔵'
    case 'pending':
      return '🟡'
    case 'rejected':
      return '🔴'
    default:
      return '•'
  }
}

function suggestionStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Aprobada'
    case 'rejected':
      return 'Rechazada'
    case 'pending':
      return 'Pendiente'
    case 'review':
      return 'En revisión'
    case 'published':
      return 'Publicada'
    default:
      return status || 'Sin estado'
  }
}

async function getMarcosProfile(admin: ReturnType<typeof createAdminClient>) {
  const { data: byEmail, error: emailError } = await admin
    .from('user_profiles')
    .select('id,full_name,email,role')
    .eq('email', MARCOS_EMAIL)
    .limit(1)
    .maybeSingle()

  if (emailError) throw emailError
  if (byEmail) return byEmail

  const { data: profiles, error } = await admin
    .from('user_profiles')
    .select('id,full_name,email,role')
    .ilike('full_name', '%Marcos%')
    .limit(5)

  if (error) throw error

  const marcos = (profiles || []).find((profile) =>
    normalizeText(String(profile.full_name || '')).includes('marcos'),
  )

  return marcos || null
}

function formatReportDate(dateText: string) {
  return new Date(`${dateText}T12:00:00-06:00`).toLocaleDateString('es-MX', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Secreto de automatización inválido.' },
      { status: 401 },
    )
  }

  try {
    const admin = createAdminClient()
    const dateParts = getMexicoDateParts()
    const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`

    // Capa extra de seguridad: el reporte solo debe salir lunes-sábado.
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short',
    }).format(new Date())

    if (weekday === 'Sun') {
      return NextResponse.json({
        shouldSend: false,
        reason: 'sunday',
        reportDate: today,
      })
    }

    const marcos = await getMarcosProfile(admin)

    if (!marcos) {
      return NextResponse.json(
        { error: 'No se encontró el perfil de Marcos.' },
        { status: 404 },
      )
    }

    const { data: sentLog, error: logError } = await admin
      .from('daily_report_whatsapp_log')
      .select('id,sent_at,status')
      .eq('user_id', marcos.id)
      .eq('report_date', today)
      .eq('recipient', RECIPIENT_EVOLUTION)
      .eq('status', 'sent')
      .maybeSingle()

    if (logError) throw logError

    if (sentLog) {
      return NextResponse.json({
        shouldSend: false,
        reason: 'already-sent',
        reportDate: today,
        sentAt: sentLog.sent_at,
      })
    }

    const startUtc = localDateTimeToUtc(today, 0, 0)
    const endUtc = localDateTimeToUtc(today, 23, 59)
    endUtc.setMinutes(endUtc.getMinutes() + 1)

    const [{ data: rawActivities, error: activitiesError }, { data: suggestions, error: suggestionsError }] =
      await Promise.all([
        admin
          .from('activities')
          .select('id,title,description,status,priority,due_date,due_time,result_notes,assigned_to,created_at,updated_at')
          .eq('assigned_to', marcos.id)
          .or(`due_date.eq.${today},updated_at.gte.${startUtc.toISOString()}`)
          .order('created_at', { ascending: true }),
        admin
          .from('content_suggestions')
          .select('id,title,description,content_type,status,created_by,created_at')
          .eq('created_by', marcos.id)
          .gte('created_at', startUtc.toISOString())
          .lt('created_at', endUtc.toISOString())
          .order('created_at', { ascending: true }),
      ])

    if (activitiesError) throw activitiesError
    if (suggestionsError) throw suggestionsError

    const activities = (rawActivities || []).filter((activity) => {
      const dueDate = activity.due_date ? String(activity.due_date).slice(0, 10) : ''
      const updatedAt = activity.updated_at ? new Date(activity.updated_at) : null
      const updatedToday = Boolean(
        updatedAt &&
          updatedAt >= startUtc &&
          updatedAt < endUtc,
      )

      return dueDate === today || updatedToday
    })

    const completed = activities.filter((activity) => activity.status === 'completed').length
    const inProgress = activities.filter((activity) => activity.status === 'in_progress').length
    const pending = activities.filter((activity) => activity.status === 'pending').length

    const activitiesText = activities.length
      ? activities
          .map((activity, index) => {
            const notes = activity.result_notes
              ? `\n   📝 ${activity.result_notes}`
              : ''

            return `${index + 1}. ${statusIcon(activity.status)} ${activity.title || 'Sin título'}\n   Estado: ${statusLabel(activity.status)} · Prioridad: ${activity.priority || 'Sin prioridad'}${notes}`
          })
          .join('\n\n')
      : 'Sin actividades registradas para hoy.'

    const suggestionsText = (suggestions || []).length
      ? (suggestions || [])
          .map((suggestion, index) =>
            `${index + 1}. 💡 ${suggestion.title}\n   Tipo: ${suggestion.content_type} · Estado: ${suggestionStatusLabel(suggestion.status)}`,
          )
          .join('\n\n')
      : 'Sin sugerencias de contenido registradas hoy.'

    const report = `📊 REPORTE DIARIO · ${formatReportDate(today).toUpperCase()}\n\n👤 Marcos\n\nRESUMEN\n✅ Completadas: ${completed}\n🔵 En progreso: ${inProgress}\n🟡 Pendientes: ${pending}\n📋 Total: ${activities.length}\n\nACTIVIDADES DEL DÍA\n${activitiesText}\n\nSUGERENCIAS DE CONTENIDO\n${suggestionsText}\n\n🤖 Generado automáticamente por Eagles Gear CRM.`

    const { error: saveError } = await admin
      .from('daily_reports')
      .upsert(
        {
          user_id: marcos.id,
          report_date: today,
          report_content: report,
        },
        {
          onConflict: 'user_id,report_date',
        },
      )

    if (saveError) throw saveError

    return NextResponse.json({
      shouldSend: true,
      userId: marcos.id,
      userName: marcos.full_name || 'Marcos',
      reportDate: today,
      report,
      recipientDisplay: RECIPIENT_DISPLAY,
      recipient: RECIPIENT_EVOLUTION,
      instanceName: INSTANCE_NAME,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el reporte automático.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Secreto de automatización inválido.' },
      { status: 401 },
    )
  }

  const payload = await request.json().catch(() => ({})) as {
    action?: string
    userId?: string
    reportDate?: string
    evolutionMessageId?: string | null
    responsePayload?: unknown
  }

  if (payload.action !== 'mark-sent') {
    return NextResponse.json(
      { error: 'Acción no válida.' },
      { status: 400 },
    )
  }

  try {
    const admin = createAdminClient()
    const marcos = await getMarcosProfile(admin)

    if (!marcos || payload.userId !== marcos.id) {
      return NextResponse.json(
        { error: 'Usuario de reporte inválido.' },
        { status: 400 },
      )
    }

    const reportDate = String(payload.reportDate || '').trim()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
      return NextResponse.json(
        { error: 'Fecha de reporte inválida.' },
        { status: 400 },
      )
    }

    const { data, error } = await admin
      .from('daily_report_whatsapp_log')
      .upsert(
        {
          user_id: marcos.id,
          report_date: reportDate,
          recipient: RECIPIENT_EVOLUTION,
          instance_name: INSTANCE_NAME,
          status: 'sent',
          evolution_message_id: payload.evolutionMessageId || null,
          response_payload: payload.responsePayload ?? null,
          sent_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,report_date,recipient',
        },
      )
      .select('id,report_date,recipient,sent_at,status')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      delivery: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo registrar el envío del reporte.',
      },
      { status: 500 },
    )
  }
}
