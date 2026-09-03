import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const courseId = 'seminario-empresarial'
const eligibleProducts = new Set(['workshop', 'high_ticket', 'workshop_high_ticket'])

type AdminClient = ReturnType<typeof createAdminClient>

interface LeadForCampus {
  id: number
  full_name: string
  phone_number: string
  email: string | null
  product: string | null
  product_interest: string | null
  product_price: number | string | null
  amount_paid: number | string | null
  payment_status: string | null
  academy_customer_id: number | null
  hotmart_customer_id: string | null
}

interface AcademyCustomer {
  id: number
  full_name: string
  phone: string | null
  email: string | null
}

function normalizeEmail(value: string | null) {
  return String(value || '').trim().toLowerCase() || null
}

function normalizePhone(value: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits || null
}

async function requireAdmin() {
  const sessionClient = await createClient()
  const { data: authData, error: authError } = await sessionClient.auth.getUser()

  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 }) }
  }

  const { data: profile } = await sessionClient
    .from('user_profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Solo un administrador puede generar accesos.' }, { status: 403 }) }
  }

  try {
    return { adminClient: createAdminClient(), user: authData.user }
  } catch (configurationError) {
    return {
      error: NextResponse.json(
        { error: configurationError instanceof Error ? configurationError.message : 'Falta configurar el acceso privado del CRM.' },
        { status: 500 }
      ),
    }
  }
}

async function getLead(client: AdminClient, rawId: string) {
  if (!/^\d+$/.test(rawId)) return null

  const { data, error } = await client
    .from('leads')
    .select('id,full_name,phone_number,email,product,product_interest,product_price,amount_paid,payment_status,academy_customer_id,hotmart_customer_id')
    .eq('id', rawId)
    .maybeSingle()

  if (error) throw error
  return data as LeadForCampus | null
}

async function findCustomer(
  client: AdminClient,
  hotmartCustomerId: string | null,
  emailNormalized: string | null,
  phoneNormalized: string | null
) {
  if (hotmartCustomerId) {
    const { data } = await client
      .from('academy_customers')
      .select('id,full_name,phone,email')
      .eq('hotmart_customer_id', hotmartCustomerId)
      .maybeSingle()
    if (data) return data as AcademyCustomer
  }

  if (emailNormalized) {
    const { data } = await client
      .from('academy_customers')
      .select('id,full_name,phone,email')
      .eq('email_normalized', emailNormalized)
      .maybeSingle()
    if (data) return data as AcademyCustomer
  }

  if (phoneNormalized) {
    const { data } = await client
      .from('academy_customers')
      .select('id,full_name,phone,email')
      .eq('phone_normalized', phoneNormalized)
      .maybeSingle()
    if (data) return data as AcademyCustomer
  }

  return null
}

async function resolveCustomer(client: AdminClient, lead: LeadForCampus) {
  if (lead.academy_customer_id) {
    const { data } = await client
      .from('academy_customers')
      .select('id,full_name,phone,email')
      .eq('id', lead.academy_customer_id)
      .maybeSingle()
    if (data) return data as AcademyCustomer
  }

  const emailNormalized = normalizeEmail(lead.email)
  const phoneNormalized = normalizePhone(lead.phone_number)
  let customer = await findCustomer(client, lead.hotmart_customer_id, emailNormalized, phoneNormalized)

  if (!customer) {
    const { data, error } = await client
      .from('academy_customers')
      .insert({
        full_name: lead.full_name.trim(),
        phone: lead.phone_number || null,
        phone_normalized: phoneNormalized,
        email: lead.email || null,
        email_normalized: emailNormalized,
        hotmart_customer_id: lead.hotmart_customer_id || null,
        created_from_lead_id: lead.id,
      })
      .select('id,full_name,phone,email')
      .single()

    if (error) {
      customer = await findCustomer(client, lead.hotmart_customer_id, emailNormalized, phoneNormalized)
      if (!customer) throw error
    } else {
      customer = data as AcademyCustomer
    }
  }

  const { error: linkError } = await client
    .from('leads')
    .update({ academy_customer_id: customer.id })
    .eq('id', lead.id)
  if (linkError) throw linkError

  return customer
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { id } = await context.params

  try {
    const lead = await getLead(auth.adminClient, id)
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })
    if (!lead.academy_customer_id) return NextResponse.json({ access: null })

    const { data, error } = await auth.adminClient
      .from('customer_campus_access')
      .select('academy_customer_id,campus_user_id,campus_username,course_id,status,provisioned_at')
      .eq('academy_customer_id', lead.academy_customer_id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ access: data || null })
  } catch {
    return NextResponse.json(
      { error: 'Falta ejecutar Migracion_Integracion_Campus.sql en Supabase del CRM.' },
      { status: 500 }
    )
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const campusUrl = String(process.env.CAMPUS_API_URL || '').replace(/\/$/, '')
  const integrationSecret = process.env.CAMPUS_PROVISIONING_SECRET || ''
  if (!campusUrl || !integrationSecret) {
    return NextResponse.json(
      { error: 'Falta configurar la conexión privada con el Campus en Vercel.' },
      { status: 500 }
    )
  }

  const { id } = await context.params

  try {
    const lead = await getLead(auth.adminClient, id)
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })

    const productIsEligible = eligibleProducts.has(lead.product || '')
      || eligibleProducts.has(lead.product_interest || '')
    if (!productIsEligible) {
      return NextResponse.json(
        { error: 'La generación de acceso está habilitada solamente para Workshop High Ticket/Elite.' },
        { status: 400 }
      )
    }

    const paid = Number(lead.amount_paid || 0)
    if (lead.payment_status !== 'paid' || paid <= 0) {
      return NextResponse.json(
        { error: 'El pago debe estar liquidado antes de generar el acceso.' },
        { status: 409 }
      )
    }

    const customer = await resolveCustomer(auth.adminClient, lead)

    let campusResponse: Response
    try {
      campusResponse = await fetch(`${campusUrl}/api/integrations/crm-provision`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${integrationSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          fullName: customer.full_name || lead.full_name,
          phone: customer.phone || lead.phone_number,
          courseId,
        }),
        cache: 'no-store',
      })
    } catch {
      return NextResponse.json({ error: 'No fue posible comunicarse con el Campus.' }, { status: 502 })
    }

    const campusData = await campusResponse.json().catch(() => ({})) as {
      error?: string
      created?: boolean
      userId?: string
      username?: string
      temporaryPassword?: string | null
      loginUrl?: string
    }

    if (!campusResponse.ok || !campusData.username) {
      return NextResponse.json(
        { error: campusData.error || 'El Campus rechazó la solicitud.' },
        { status: campusResponse.status >= 400 ? campusResponse.status : 502 }
      )
    }

    const { error: trackingError } = await auth.adminClient
      .from('customer_campus_access')
      .upsert({
        academy_customer_id: customer.id,
        source_lead_id: lead.id,
        course_id: courseId,
        campus_user_id: campusData.userId || null,
        campus_username: campusData.username,
        status: 'active',
        created_by: auth.user.id,
        provisioned_at: new Date().toISOString(),
      }, { onConflict: 'academy_customer_id,course_id' })
    if (trackingError) {
      return NextResponse.json(
        { error: 'El acceso existe en el Campus, pero el CRM no pudo guardar la referencia. Reintenta para sincronizarla.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      access: {
        customerId: customer.id,
        username: campusData.username,
        temporaryPassword: campusData.temporaryPassword || null,
        created: Boolean(campusData.created),
        loginUrl: campusData.loginUrl || `${campusUrl}/login`,
      },
    })
  } catch (error) {
    console.error('Error generando acceso al Campus:', error)
    return NextResponse.json(
      { error: 'No fue posible preparar el cliente y su acceso. Revisa la migración del CRM.' },
      { status: 500 }
    )
  }
}
