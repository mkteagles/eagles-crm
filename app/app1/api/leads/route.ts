import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /app1/api/leads?status=new&platform=fb&search=juan
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const platform = searchParams.get('platform')
  const search = searchParams.get('search')

  let query = supabase
    .from('leads')
    .select('*, lead_metrics(*)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('lead_status', status)
  if (platform && platform !== 'all') query = query.eq('platform', platform)
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ leads: data })
}

// POST /app1/api/leads  → creación manual desde el CRM (formulario "Nuevo lead")
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Solo usuarios logueados pueden crear leads manuales desde la UI.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { full_name, phone_number, email, platform, campaign_name, notes, source } = body

    if (!full_name || !phone_number) {
      return NextResponse.json(
        { error: 'full_name y phone_number son obligatorios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name,
        phone_number,
        email: email || null,
        platform: platform || 'fb',
        campaign_name: campaign_name || null,
        notes: notes || null,
        source: source || 'manual',
        lead_status: 'new',
        score: 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
}
