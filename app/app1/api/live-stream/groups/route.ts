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
        whatsapp_instances!inner (
          code,
          instance_name,
          name,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('purpose', 'live')
      .eq('whatsapp_instances.code', 'GRUPOS')
      .eq('whatsapp_instances.is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      instance: 'GRUPOS',
      groups: (data || []).map((row) => ({
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
