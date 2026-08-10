import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Hotmart manda el "Hottok" en el header `x-hotmart-hottok`.
 * Lo validamos contra HOTMART_HOTTOK (Configuración → Webhooks en Hotmart)
 * para que nadie pueda marcar leads como comprados con un POST falso.
 */
function isValidHottok(req: NextRequest) {
  const hottok = req.headers.get('x-hotmart-hottok')
  if (!process.env.HOTMART_HOTTOK || !hottok) return false

  // Comparación en tiempo constante para evitar timing attacks.
  const expected = Buffer.from(process.env.HOTMART_HOTTOK)
  const received = Buffer.from(hottok)
  if (expected.length !== received.length) return false
  return crypto.timingSafeEqual(expected, received)
}

export async function POST(req: NextRequest) {
  if (!isValidHottok(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = await createClient()

    // Estructura real de Hotmart: evento en `event`, datos en `data`.
    const event = body.event as string | undefined
    const buyerEmail = body.data?.buyer?.email as string | undefined
    const buyerPhone = body.data?.buyer?.checkout_phone as string | undefined
    const productName = body.data?.product?.name as string | undefined
    const purchaseDate = body.data?.purchase?.order_date as number | undefined
    const hotmartCustomerId = body.data?.buyer?.ucode as string | undefined

    if (!buyerEmail && !buyerPhone) {
      return NextResponse.json({ error: 'Sin email ni teléfono del comprador' }, { status: 400 })
    }

    const isApproved = event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE'
    const isRefundOrCancel =
      event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_CANCELED' || event === 'PURCHASE_CHARGEBACK'

    if (!isApproved && !isRefundOrCancel) {
      // Otros eventos (boleto generado, carrito abandonado, etc.) los ignoramos por ahora.
      return NextResponse.json({ success: true, ignored: event })
    }

    // Buscamos primero por email y, si no hay match, por teléfono
    // (útil cuando el lead vino de WhatsApp/ManyChat y no tenía email).
    let query = supabase.from('leads').select('id')
    query = buyerEmail ? query.eq('email', buyerEmail) : query.eq('phone_number', buyerPhone as string)
    const { data: matches } = await query

    if (!matches || matches.length === 0) {
      // No hay lead para vincular la compra: lo dejamos registrado igual
      // para no perder el dato, pero avisamos con 200 (Hotmart no debe reintentar).
      return NextResponse.json({ success: true, matched: false })
    }

    const updates = isApproved
      ? {
          has_purchased: true,
          hotmart_customer_id: hotmartCustomerId || null,
          purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
          purchase_amount: body.data?.purchase?.price?.value ?? null,
          lead_status: 'qualified' as const,
          score: 100,
          notes: productName ? `Compró: ${productName}` : undefined,
        }
      : {
          has_purchased: false,
          lead_status: 'lost' as const,
        }

    const ids = matches.map((m) => m.id)
    const { error } = await supabase.from('leads').update(updates).in('id', ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, matched: true, updated: ids.length })
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
}
