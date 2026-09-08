import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export async function GET() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role,email,full_name')
    .eq('id', authData.user.id)
    .maybeSingle()

  const email = String(profile?.email || authData.user.email || '').trim().toLowerCase()
  const name = normalizeText(String(profile?.full_name || ''))
  const isUrsula = email === 'ursula@eagles.com' || name.includes('ursula')
  if (!isUrsula) {
    return NextResponse.json({ error: 'Los grupos de Lives solo están disponibles para Úrsula.' }, { status: 403 })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('whatsapp_groups')
      .select(`
        code,
        name,
        group_jid,
        purpose,
        is_active,
        whatsapp_instances (
          code,
          instance_name,
          name,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    // Evitamos depender de filtros PostgREST sobre la relación, porque según
    // cómo quedó registrada la instancia/grupo pueden devolver 0 filas aunque
    // el grupo exista. Filtramos aquí de forma robusta.
    const TEST_GROUP_JID = '120363409439960903@g.us'
    const groups = (data || []).filter((row) => {
      const relation = Array.isArray(row.whatsapp_instances)
        ? row.whatsapp_instances[0]
        : row.whatsapp_instances

      const instanceCode = normalizeText(String(relation?.code || ''))
      const instanceName = normalizeText(String(relation?.instance_name || ''))
      const isGroupsInstance = (instanceCode === 'grupos' || instanceName === 'grupos') && relation?.is_active !== false

      const purpose = normalizeText(String(row.purpose || ''))
      const code = normalizeText(String(row.code || ''))
      const isLiveGroup = purpose === 'live' || code.startsWith('live_') || row.group_jid === TEST_GROUP_JID

      return isGroupsInstance && isLiveGroup
    })

    return NextResponse.json({
      instance: 'GRUPOS',
      groups: groups.map((row) => ({
        code: row.code,
        name: row.name,
        groupJid: row.group_jid,
        purpose: row.purpose,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron cargar los grupos de la instancia GRUPOS.' },
      { status: 500 },
    )
  }
}
