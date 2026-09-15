import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SEPTEMBER_2026_SEED } from '@/lib/creative-calendar-september-2026'
import {
  assertCreativeEditor,
  creativeCalendarSession,
  validPeriod,
} from '@/lib/creative-calendar-server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error

  const url = new URL(request.url)
  const period = String(url.searchParams.get('period') || '')
  if (!validPeriod(period)) {
    return NextResponse.json({ error: 'Periodo inválido.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const periodMonth = `${period}-01`

    const [{ data: loadedItems, error: itemsError }, { data: imports, error: importsError }] = await Promise.all([
      admin
        .from('creative_calendar_items')
        .select('*')
        .eq('period_month', periodMonth)
        .order('publish_date', { ascending: true, nullsFirst: false })
        .order('item_number', { ascending: true, nullsFirst: false }),
      admin
        .from('creative_calendar_imports')
        .select('id,file_name,imported_at,row_count,detected_period')
        .eq('period_month', periodMonth)
        .order('imported_at', { ascending: false })
        .limit(1),
    ])

    if (itemsError) throw itemsError
    if (importsError) throw importsError

    let items = loadedItems || []

    // Respaldo automático: si septiembre 2026 quedó vacío aunque la migración
    // ya se haya ejecutado, el CRM carga la base del Word compartido una sola vez.
    if (period === '2026-09' && items.length === 0) {
      const payload = SEPTEMBER_2026_SEED.map((row) => ({
        ...row,
        period_month: '2026-09-01',
        created_by: session.userId,
        updated_by: session.userId,
      }))

      const { data: seededItems, error: seedError } = await admin
        .from('creative_calendar_items')
        .insert(payload)
        .select('*')

      if (seedError) throw seedError
      items = seededItems || []
    }

    return NextResponse.json({
      items,
      canEdit: session.canEdit,
      isUrsula: session.isUrsula,
      sourceImport: imports?.[0] || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar el calendario creativo.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error
  const forbidden = assertCreativeEditor(session)
  if (forbidden) return forbidden

  const payload = await request.json().catch(() => ({})) as Record<string, unknown>
  const period = String(payload.period || '')
  if (!validPeriod(period)) {
    return NextResponse.json({ error: 'Periodo inválido.' }, { status: 400 })
  }

  const publishDate = String(payload.publish_date || '').trim() || null
  if (publishDate && !/^20\d{2}-\d{2}-\d{2}$/.test(publishDate)) {
    return NextResponse.json({ error: 'La fecha de publicación no es válida.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('creative_calendar_items')
      .insert({
        period_month: `${period}-01`,
        item_number: payload.item_number || null,
        category: String(payload.category || 'Contenido').trim() || 'Contenido',
        publication: String(payload.publication || '').trim(),
        copy_text: String(payload.copy_text || '').trim(),
        content_text: String(payload.content_text || '').trim(),
        schedule_text: String(payload.schedule_text || '').trim(),
        distribution_type: String(payload.distribution_type || '').trim(),
        responsible: String(payload.responsible || 'Ursula').trim(),
        approved: Boolean(payload.approved),
        status_text: String(payload.status_text || '').trim(),
        publish_date: publishDate,
        publish_time: String(payload.publish_time || '').trim() || null,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear el contenido.' },
      { status: 500 },
    )
  }
}
