import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  assertCreativeEditor,
  creativeCalendarSession,
} from '@/lib/creative-calendar-server'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error
  const forbidden = assertCreativeEditor(session)
  if (forbidden) return forbidden

  const { id } = await context.params
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>

  const publishDate = String(payload.publish_date || '').trim() || null
  if (publishDate && !/^20\d{2}-\d{2}-\d{2}$/.test(publishDate)) {
    return NextResponse.json({ error: 'La fecha de publicación no es válida.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('creative_calendar_items')
      .update({
        category: String(payload.category || 'Contenido').trim() || 'Contenido',
        publication: String(payload.publication || '').trim(),
        copy_text: String(payload.copy_text || '').trim(),
        content_text: String(payload.content_text || '').trim(),
        schedule_text: String(payload.schedule_text || '').trim(),
        distribution_type: String(payload.distribution_type || '').trim(),
        responsible: String(payload.responsible || '').trim(),
        approved: Boolean(payload.approved),
        status_text: String(payload.status_text || '').trim(),
        publish_date: publishDate,
        publish_time: String(payload.publish_time || '').trim() || null,
        updated_by: session.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'No se encontró el contenido.' }, { status: 404 })

    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar el contenido.' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error
  const forbidden = assertCreativeEditor(session)
  if (forbidden) return forbidden

  const { id } = await context.params

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('creative_calendar_items').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar el contenido.' },
      { status: 500 },
    )
  }
}
