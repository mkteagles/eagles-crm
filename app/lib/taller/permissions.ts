import { createClient } from '@/lib/supabase/client'

export type TallerAccessLevel = 'manager' | 'operator'

export interface TallerAccess {
  user_id: string
  access_level: TallerAccessLevel
  is_active: boolean
}

export async function getTallerAccess(): Promise<TallerAccess | null> {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('taller_user_access')
    .select('user_id, access_level, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    console.error('Error obteniendo acceso Taller:', error)
    return null
  }

  return data as TallerAccess
}

export function canAccessTaller(
  access: TallerAccess | null
): boolean {
  return !!access?.is_active
}

export function isTallerManager(
  access: TallerAccess | null
): boolean {
  return access?.access_level === 'manager'
}

export function isTallerOperator(
  access: TallerAccess | null
): boolean {
  return access?.access_level === 'operator'
}