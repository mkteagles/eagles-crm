import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

function isValidHottok(req: NextRequest) {
  const hottok = req.headers.get('x-hotmart-hottok')
  if (!process.env.HOTMART_HOTTOK || !hottok) return false

  const expected = Buffer.from(process.env.HOTMART_HOTTOK)
  const received = Buffer.from(hottok)
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

function normalizePhone(value: string | undefined) {
  return String(value || '').replace(/\D/g, '')
}

function purchaseDateToIso(value: unknown) {
  if (typeof value === 'number' || (typeof value === 'string' && value.trim())) {
    const raw = Number(value)
    const date = new Date(raw < 10_000_000_000 ? raw * 1000 : raw)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return new Date().toISOString()
}

export async function POST(req: NextRequest) {
  if (!isValidHottok(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const event = String(body.event || '')
    const buyerEmail = String(body.data?.buyer?.email || '').trim().toLowerCase()
    const buyerPhone = normalizePhone(body.data?.buyer?.checkout_phone)
    const productName = String(body.data?.product?.name || '').trim()
    const transactionId = String(body.data?.purchase?.transaction || '').trim()
    const hotmartCustomerId = String(body.data?.buyer?.ucode || '').trim()
    const purchaseAmount = Number(body.data?.purchase?.price?.value || 0)
    const purchaseDate = purchaseDateToIso(body.data?.purchase?.order_date)

    if (!buyerEmail && !buyerPhone) {
      return NextResponse.json({ error: 'Sin email ni teléfono del comprador' }, { status: 400 })
    }

    const isApproved = event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE'
    const isRefundOrCancel = ['PURCHASE_REFUNDED', 'PURCHASE_CANCELED', 'PURCHASE_CHARGEBACK'].includes(event)
    if (!isApproved && !isRefundOrCancel) {
      return NextResponse.json({ success: true, ignored: event })
    }

    const supabase = createAdminClient()
    const selected = 'id,notes,product_price,academy_customer_id'
    let matches: Array<{
      id: number
      notes: string | null
      product_price: number | string | null
      academy_customer_id: number | null
    }> = []

    if (buyerEmail) {
      const { data, error } = await supabase.from('leads').select(selected).ilike('email', buyerEmail)
      if (error) throw error
      matches = data || []
    }

    if (matches.length === 0 && buyerPhone) {
      const { data, error } = await supabase.from('leads').select(selected).eq('phone_number', buyerPhone)
      if (error) throw error
      matches = data || []
    }

    if (matches.length === 0) {
      return NextResponse.json({ success: true, matched: false })
    }

    for (const lead of matches) {
      const note = isApproved
        ? `Compra Hotmart aprobada${productName ? `: ${productName}` : ''}${transactionId ? ` (${transactionId})` : ''}`
        : `Compra Hotmart revertida: ${event}${transactionId ? ` (${transactionId})` : ''}`
      const notes = [lead.notes, note].filter(Boolean).join('\n')
      const amount = purchaseAmount > 0 ? purchaseAmount : Number(lead.product_price || 0)

      const updates = isApproved
        ? {
            has_purchased: true,
            hotmart_customer_id: hotmartCustomerId || null,
            hotmart_transaction_id: transactionId || null,
            purchase_date: purchaseDate,
            purchase_amount: amount,
            payment_status: 'paid',
            amount_paid: amount,
            purchased_product: productName || null,
            lead_status: 'qualified',
            score: 100,
            notes,
          }
        : {
            has_purchased: false,
            payment_status: 'unpaid',
            amount_paid: 0,
            lead_status: 'lost',
            notes,
          }

      const { error } = await supabase.from('leads').update(updates).eq('id', lead.id)
      if (error) throw error

      if (isApproved && hotmartCustomerId && lead.academy_customer_id) {
        const { error: customerError } = await supabase
          .from('academy_customers')
          .update({ hotmart_customer_id: hotmartCustomerId })
          .eq('id', lead.academy_customer_id)
          .is('hotmart_customer_id', null)
        if (customerError) throw customerError
      }
    }

    return NextResponse.json({ success: true, matched: true, updated: matches.length })
  } catch (error) {
    console.error('Error procesando webhook Hotmart:', error)
    return NextResponse.json({ error: 'No fue posible procesar el webhook.' }, { status: 500 })
  }
}
