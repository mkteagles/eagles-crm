import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { COPY_FRAMEWORK_AIDA, LIVE_STREAM_COPY_TUESDAY, type CopyRequest } from '@/lib/copy-center'

// Ollama puede tardar más en la primera generación mientras carga el modelo.
// Vercel mantiene esta función disponible y el fetch conserva un margen menor.
export const maxDuration = 180

type N8nPayload = {
  copy?: string
  output?: string
  text?: string
  image_prompt?: string
  execution_id?: string
}

function parseN8nResponse(payload: unknown): N8nPayload {
  const candidate = Array.isArray(payload) ? payload[0] : payload
  if (!candidate || typeof candidate !== 'object') return {}
  return candidate as N8nPayload
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function isWorkshopCopy(item: CopyRequest) {
  return normalizeText(item.product_topic || '').includes('workshop')
}

function isCourseCopy(item: CopyRequest) {
  return item.category === 'course' && !isWorkshopCopy(item)
}

function isLiveCopy(item: CopyRequest) {
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

function getCampaignCode(item: CopyRequest) {
  const topic = normalizeText(item.product_topic || '')
  if (topic.includes('workshop') && item.campaign_month === '2026-10') return 'WORKSHOP_OCTUBRE'
  if (topic.includes('jf017') && item.campaign_month === '2026-10') return 'CURSO_JF017_OCTUBRE'
  return null
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const { id } = await context.params
  const [{ data: copyRequest, error: requestError }, { data: profile }] = await Promise.all([
    supabase.from('copy_requests').select('*').eq('id', id).maybeSingle(),
    supabase.from('user_profiles').select('role,email,full_name').eq('id', authData.user.id).maybeSingle(),
  ])

  if (requestError || !copyRequest) {
    return NextResponse.json({ error: 'No se encontró la solicitud de copy.' }, { status: 404 })
  }

  const item = copyRequest as CopyRequest
  const userEmail = String(profile?.email || authData.user.email || '').trim().toLowerCase()
  const normalizedUserName = normalizeText(String(profile?.full_name || ''))
  const workshopOnlyMarcos = isWorkshopCopy(item)
  const courseOnlyVictoria = isCourseCopy(item)
  const liveOnlyUrsula = isLiveCopy(item)
  const isMarcos = userEmail === 'marcosc@eagles.com' || normalizedUserName.includes('marcos')
  const isVictoria = normalizedUserName.includes('victoria')
  const isUrsula = userEmail === 'ursula@eagles.com' || normalizedUserName.includes('ursula')
  const isGenericAdmin = profile?.role === 'admin' && !isMarcos && !isVictoria && !isUrsula
  const canGenerate = liveOnlyUrsula
    ? isUrsula
    : isGenericAdmin
      || (workshopOnlyMarcos
        ? isMarcos
        : courseOnlyVictoria
          ? isVictoria
          : item.assigned_to === authData.user.id || item.requested_by === authData.user.id)

  if (!canGenerate) {
    return NextResponse.json({ error: 'No tienes permiso para generar este copy.' }, { status: 403 })
  }

  if (liveOnlyUrsula) {
    const topic = cleanLiveTopic(item.product_topic)
    const generatedCopy = LIVE_STREAM_COPY_TUESDAY(topic)

    const { data: updated, error: updateError } = await supabase
      .from('copy_requests')
      .update({
        status: 'draft',
        generated_copy: generatedCopy,
        final_copy: generatedCopy,
        image_prompt: null,
        n8n_execution_id: null,
        generation_error: null,
        generated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ request: updated, deterministic: true })
  }

  const webhookUrl = process.env.N8N_COPY_WEBHOOK_URL?.trim()
  const webhookSecret = process.env.N8N_COPY_WEBHOOK_SECRET?.trim()

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json(
      { error: 'Falta configurar N8N_COPY_WEBHOOK_URL y N8N_COPY_WEBHOOK_SECRET en Vercel del CRM.' },
      { status: 503 },
    )
  }

  await supabase
    .from('copy_requests')
    .update({ status: 'generating', generation_error: null })
    .eq('id', id)

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-eagles-secret': webhookSecret,
      },
      body: JSON.stringify({
        event: 'copy.generate',
        request_id: item.id,
        requested_by: authData.user.id,
        copy_request: {
          title: item.title,
          category: item.category,
          product_topic: item.product_topic,
          campaign_month: item.campaign_month,
          channels: item.channels,
          objective: item.objective,
          tone: item.tone,
          audience: item.audience,
          brief: item.brief,
          call_to_action: item.call_to_action,
          needs_image: item.needs_image,
          image_brief: item.image_brief,
          campaign_code: getCampaignCode(item),
          copy_framework: 'AIDA',
        },
        framework: {
          name: 'AIDA',
          stages: COPY_FRAMEWORK_AIDA,
          instruction: 'Aplica AIDA de forma natural. No escribas las etiquetas Atracción, Interés, Deseo o Acción dentro del copy final.',
        },
        rules: [
          'Usa la metodología AIDA en este orden: Atracción, Interés, Deseo y Acción.',
          'Atracción: abre con un gancho corto basado en un dolor, duda, falla o situación real de la audiencia.',
          'Interés: aporta una sola idea útil, técnica o relevante que mantenga la lectura.',
          'Deseo: conecta esa idea con el beneficio concreto del curso, workshop, servicio o contenido.',
          'Acción: termina con un solo CTA claro y directo.',
          'No escribas las palabras Atracción, Interés, Deseo o Acción como títulos dentro del copy.',
          'Escribe en español natural y listo para publicar.',
          'No inventes precio, fecha, disponibilidad, garantía ni promoción.',
          'No diagnostiques definitivamente una transmisión por mensaje.',
          'Para taller, solicita marca, modelo, año y síntomas; dirige a inspección o cita.',
          'Entrega variantes separadas cuando haya varios canales.',
          'Devuelve JSON con copy y, si needs_image=true, image_prompt.',
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(150000),
    })

    const rawPayload: unknown = await n8nResponse.json().catch(() => null)
    const result = parseN8nResponse(rawPayload)
    const generatedCopy = String(result.copy || result.output || result.text || '').trim()

    if (!n8nResponse.ok || !generatedCopy) {
      throw new Error(
        !n8nResponse.ok
          ? `n8n respondió con estado ${n8nResponse.status}.`
          : 'n8n no devolvió el campo copy, output o text.',
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('copy_requests')
      .update({
        status: 'draft',
        generated_copy: generatedCopy,
        final_copy: generatedCopy,
        image_prompt: result.image_prompt || null,
        n8n_execution_id: result.execution_id || null,
        generation_error: null,
        generated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError
    return NextResponse.json({ request: updated })
  } catch (error) {
    const isTimeout = error instanceof Error
      && (error.name === 'TimeoutError' || error.name === 'AbortError')
    const message = isTimeout
      ? 'Ollama tardó más de 150 segundos. Intenta generar nuevamente; el modelo normalmente responderá más rápido al quedar cargado.'
      : error instanceof Error
        ? error.message
        : 'No se pudo conectar con n8n.'
    await supabase
      .from('copy_requests')
      .update({ status: 'pending', generation_error: message })
      .eq('id', id)

    return NextResponse.json({ error: message }, { status: 502 })
  }
}
