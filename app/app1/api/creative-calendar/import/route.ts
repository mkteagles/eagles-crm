import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  assertCreativeEditor,
  creativeCalendarSession,
  validPeriod,
} from '@/lib/creative-calendar-server'
import { parseCreativeCalendarDocx } from '@/lib/docx-fixed-format'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'creative-calendar-files'
const MAX_FILE_SIZE = 10 * 1024 * 1024

function safeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'calendario.docx'
}

export async function POST(request: Request) {
  const session = await creativeCalendarSession()
  if ('error' in session) return session.error
  const forbidden = assertCreativeEditor(session)
  if (forbidden) return forbidden

  const formData = await request.formData()
  const file = formData.get('file')
  const period = String(formData.get('period') || '')
  const replaceMonth = String(formData.get('replace') || 'true') !== 'false'

  if (!validPeriod(period)) {
    return NextResponse.json({ error: 'Selecciona un mes válido.' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Selecciona el archivo Word (.docx).' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.docx')) {
    return NextResponse.json({ error: 'El formato debe ser Word .docx.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El Word supera el límite de 10 MB.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = parseCreativeCalendarDocx(buffer, period)

    if (!parsed.rows.length) {
      return NextResponse.json(
        { error: 'No encontré filas del formato fijo. Verifica que el Word conserve la tabla original.' },
        { status: 422 },
      )
    }

    const admin = createAdminClient()
    const periodMonth = `${period}-01`
    const path = `${period}/${Date.now()}-${safeFileName(file.name)}`

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: imported, error: importError } = await admin
      .from('creative_calendar_imports')
      .insert({
        period_month: periodMonth,
        file_name: file.name,
        storage_path: path,
        imported_by: session.userId,
        row_count: parsed.rows.length,
        detected_period: parsed.detectedPeriod,
      })
      .select('id,file_name,imported_at,row_count,detected_period')
      .single()

    if (importError) {
      await admin.storage.from(BUCKET).remove([path])
      throw importError
    }

    if (replaceMonth) {
      const { error: deleteError } = await admin
        .from('creative_calendar_items')
        .delete()
        .eq('period_month', periodMonth)
      if (deleteError) throw deleteError
    }

    const payload = parsed.rows.map((row) => ({
      import_id: imported.id,
      period_month: periodMonth,
      item_number: row.itemNumber,
      category: row.category,
      publication: row.publication,
      copy_text: row.copyText,
      content_text: row.contentText,
      schedule_text: row.scheduleText,
      distribution_type: row.distributionType,
      responsible: row.responsible || 'Ursula',
      approved: row.approved,
      status_text: row.statusText,
      publish_date: row.publishDate,
      publish_time: row.publishTime,
      source_row: { cells: row.sourceCells },
      created_by: session.userId,
      updated_by: session.userId,
    }))

    const { data: items, error: insertError } = await admin
      .from('creative_calendar_items')
      .insert(payload)
      .select('*')

    if (insertError) throw insertError

    const warnings: string[] = []
    if (parsed.detectedPeriod && parsed.detectedPeriod !== period) {
      warnings.push(`El Word parece decir ${parsed.detectedPeriod}, pero se importó en ${period}.`)
    }
    const withoutDate = parsed.rows.filter((row) => !row.publishDate).length
    if (withoutDate) {
      warnings.push(`${withoutDate} elemento(s) quedaron sin fecha y aparecen en “Sin fecha”.`)
    }

    return NextResponse.json({
      ok: true,
      items: items || [],
      sourceImport: imported,
      warnings,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo importar el Word.' },
      { status: 500 },
    )
  }
}
