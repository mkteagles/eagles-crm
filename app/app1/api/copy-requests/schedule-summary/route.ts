import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type DeliveryRow = {
  id: string
  copy_request_ref: string | null
  campaign_code: string | null
  status: string
  scheduled_at: string | null
  sent_at: string | null
  error_message: string | null
  whatsapp_groups: {
    name: string | null
    group_jid: string | null
    whatsapp_instances: {
      instance_name: string | null
    } | null
  } | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  try {
    // Esta consulta respeta el RLS de copy_requests. Así cada persona solo
    // recibe estados de programación de los copys que ya puede ver en su Centro.
    const { data: visibleCopies, error: visibleCopiesError } = await supabase
      .from('copy_requests')
      .select('id')

    if (visibleCopiesError) throw visibleCopiesError

    const copyIds = (visibleCopies || [])
      .map((item) => String(item.id || ''))
      .filter(Boolean)

    if (!copyIds.length) {
      return NextResponse.json({ deliveries: [] })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('whatsapp_deliveries')
      .select(`
        id,
        copy_request_ref,
        campaign_code,
        status,
        scheduled_at,
        sent_at,
        error_message,
        whatsapp_groups (
          name,
          group_jid,
          whatsapp_instances (
            instance_name
          )
        )
      `)
      .in('copy_request_ref', copyIds)
      .in('status', ['scheduled', 'sending', 'sent', 'failed'])
      .order('scheduled_at', { ascending: true })
      .limit(1000)

    if (error) throw error

    const deliveries = ((data || []) as unknown as DeliveryRow[]).map((row) => ({
      id: row.id,
      copyRequestRef: row.copy_request_ref,
      campaignCode: row.campaign_code,
      status: row.status,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      errorMessage: row.error_message,
      groupName: row.whatsapp_groups?.name || null,
      groupJid: row.whatsapp_groups?.group_jid || null,
      instanceName: row.whatsapp_groups?.whatsapp_instances?.instance_name || null,
    }))

    return NextResponse.json({ deliveries })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar el estado de programación.' },
      { status: 500 },
    )
  }
}
