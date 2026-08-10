import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// El "dashboard" principal redirige según el rol del usuario:
// executor (Marcos, Community) -> área de marketing
// admin / viewer -> listado de leads
export default async function App1Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'executor') {
      redirect('/app1/marketing')
    }
  }

  redirect('/app1/leads')
}
