import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

const BUCKET = 'report-evidence'

export async function POST(request: Request) {
  const expected = process.env.REPORT_EVIDENCE_CLEANUP_SECRET
  const received = request.headers.get('x-eagles-cleanup-secret') || ''

  if (!expected || received !== expected) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { data: expired, error } = await admin
      .from('report_evidence')
      .select('id,storage_path')
      .lte('expires_at', new Date().toISOString())
      .limit(500)

    if (error) throw error
    if (!expired?.length) return NextResponse.json({ deleted: 0 })

    const paths = expired.map((item) => String(item.storage_path)).filter(Boolean)
    if (paths.length) {
      const { error: storageError } = await admin.storage.from(BUCKET).remove(paths)
      if (storageError) throw storageError
    }

    const ids = expired.map((item) => item.id)
    const { error: deleteError } = await admin.from('report_evidence').delete().in('id', ids)
    if (deleteError) throw deleteError

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo limpiar evidencia.' },
      { status: 500 },
    )
  }
}
