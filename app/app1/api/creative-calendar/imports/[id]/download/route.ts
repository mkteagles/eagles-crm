import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { creativeCalendarSession } from '@/lib/creative-calendar-server'

export const runtime = 'nodejs'

const BUCKET = 'creative-calendar-files'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error

  const { id } = await context.params

  try {
    const admin = createAdminClient()
    const { data: imported, error } = await admin
      .from('creative_calendar_imports')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!imported?.storage_path) {
      return NextResponse.json({ error: 'No se encontró el Word original.' }, { status: 404 })
    }

    const { data, error: signedError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(imported.storage_path, 120)

    if (signedError) throw signedError
    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo abrir el Word.' },
      { status: 500 },
    )
  }
}
