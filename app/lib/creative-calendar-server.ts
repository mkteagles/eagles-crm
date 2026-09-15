import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export async function creativeCalendarSession() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return {
      error: NextResponse.json(
        { error: 'Tu sesión venció. Vuelve a iniciar sesión.' },
        { status: 401 },
      ),
    }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id,full_name,email,role')
    .eq('id', authData.user.id)
    .maybeSingle()

  const fullName = String(profile?.full_name || authData.user.user_metadata?.full_name || '')
  const email = String(profile?.email || authData.user.email || '')
  const normalizedName = normalize(fullName)
  const normalizedEmail = normalize(email)
  const isUrsula = normalizedName.includes('ursula') || normalizedEmail === 'ursula@eagles.com' || normalizedEmail.includes('ursula')
  const isMarcos = normalizedName.includes('marcos') || normalizedEmail === 'marcosc@eagles.com' || normalizedEmail.includes('marcos')
  const canEdit = isUrsula || isMarcos || profile?.role === 'admin'

  return {
    userId: authData.user.id,
    profile: {
      id: authData.user.id,
      full_name: fullName,
      email,
      role: profile?.role || 'executor',
    },
    isUrsula,
    isMarcos,
    canEdit,
  }
}

export function assertCreativeEditor(session: { canEdit: boolean }) {
  if (session.canEdit) return null
  return NextResponse.json(
    { error: 'El calendario creativo solo puede ser editado por Úrsula, Marcos o un administrador.' },
    { status: 403 },
  )
}

export function validPeriod(value: string) {
  return /^20\d{2}-(0[1-9]|1[0-2])$/.test(value)
}
