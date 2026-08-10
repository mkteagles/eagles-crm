import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Recibe los leads que ya vienen normalizados desde tu flujo de n8n:
 * Facebook Lead Ads Trigger → Code (normaliza) → HTTP Request a este endpoint.
 *
 * Espera este body (mismo shape que ya normaliza tu nodo Code):
 * { meta_lead_id, full_name, phone_number, email, platform, campaign_name?, ad_name?, source }
 *
 * Protegido con un secreto compartido en el header `x-n8n-secret`
 * (configura N8N_WEBHOOK_SECRET en .env y en el nodo HTTP Request de n8n).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-n8n-secret')

  if (!process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_SECRET no está configurado en el servidor' },
      { status: 500 }
    )
  }

  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      meta_lead_id,
      full_name,
      phone_number,
      email,
      platform,
      campaign_name,
      ad_name,
      source,
    } = body

    if (!meta_lead_id || !full_name || !phone_number) {
      return NextResponse.json(
        { error: 'meta_lead_id, full_name y phone_number son obligatorios' },
        { status: 400 }
      )
    }

    // Usamos service role para saltar RLS, ya que este endpoint corre
    // server-to-server (n8n) y no tiene sesión de usuario de Supabase.
    const supabase = await createClient()

    // Upsert por meta_lead_id: si n8n reenvía el mismo lead (reintentos,
    // formularios duplicados) no se crean filas repetidas.
    const { data, error } = await supabase
      .from('leads')
      .upsert(
        {
          meta_lead_id,
          full_name,
          phone_number,
          email: email || null,
          platform: platform || 'fb',
          campaign_name: campaign_name || null,
          ad_name: ad_name || null,
          source: source || 'meta_ads',
          lead_status: 'new',
        },
        { onConflict: 'meta_lead_id', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, lead: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
}
