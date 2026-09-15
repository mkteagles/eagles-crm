import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { creativeCalendarSession } from '@/lib/creative-calendar-server'

export const runtime = 'nodejs'

const BUCKET = 'creative-calendar-files'

function contentDisposition(name: string) {
  const safe = name.replace(/[\r\n"]/g, '').trim() || 'calendario.docx'
  return `attachment; filename="${safe}"`
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error

  const { id } = await context.params

  try {
    const admin = createAdminClient()
    const { data: imported, error: importError } = await admin
      .from('creative_calendar_imports')
      .select('file_name,storage_path')
      .eq('id', id)
      .maybeSingle()

    if (importError) throw importError
    if (!imported) {
      return NextResponse.json({ error: 'No se encontró el Word original.' }, { status: 404 })
    }

    const { data: file, error: downloadError } = await admin.storage
      .from(BUCKET)
      .download(imported.storage_path)

    if (downloadError) throw downloadError

    return new Response(await file.arrayBuffer(), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': contentDisposition(imported.file_name),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo descargar el Word.' },
      { status: 500 },
    )
  }
}
