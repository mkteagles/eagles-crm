'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityWithUser, UserProfile, DailyReport, ConsolidatedReport } from '@/lib/marketing-types'

export const useCurrentUser = () => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
          setUser(data)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [mounted, supabase])

  return { user, loading, mounted }
}

export const useActivities = () => {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, mounted } = useCurrentUser()
  const supabase = createClient()

  useEffect(() => {
    if (!mounted || !user) return

    let isSubscribed = true

    const fetchActivities = async () => {
      try {
        let query = supabase
          .from('activities')
          .select('*')
          .order('due_date', { ascending: true })

        if (user.role === 'executor') {
          query = query.eq('assigned_to', user.id)
        }

        const [{ data, error }, { data: profiles }] = await Promise.all([
          query,
          supabase.from('user_profiles').select('id, full_name'),
        ])

        if (isSubscribed && !error) {
          const nameById = new Map((profiles || []).map((p: any) => [p.id, p.full_name]))
          const withNames = (data || []).map((a: any) => ({
            ...a,
            assigned_to_name: nameById.get(a.assigned_to) || a.assigned_to,
            created_by_name: nameById.get(a.created_by) || a.created_by,
            approved_by_name: a.approved_by ? (nameById.get(a.approved_by) || a.approved_by) : undefined,
          }))
          setActivities(withNames)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }

    fetchActivities()

    // Realtime subscription - ORDEN CORRECTO: .on() ANTES de .subscribe()
    const channel = supabase
      .channel('activities_changes_' + Date.now())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          if (isSubscribed) {
            fetchActivities()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CLOSED') {
          console.log('Realtime connection closed')
        }
      })

    return () => {
      isSubscribed = false
      supabase.removeChannel(channel)
    }
  }, [user, mounted, supabase])

  return { activities, loading }
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loaded, setLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoaded(true)
      }
    }

    fetchUsers()
  }, [supabase])

  return { users, loaded }
}

export const useDailyReport = (userId: string, reportDate: string) => {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const fetchReport = async () => {
      try {
        const { data } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('user_id', userId)
          .eq('report_date', reportDate)
          .single()
        setReport(data)
      } catch (error) {
        console.error('Error fetching report:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [userId, reportDate, supabase])

  return { report, loading }
}

export const useConsolidatedReports = () => {
  const [reports, setReports] = useState<ConsolidatedReport[]>([])
  const { user, mounted } = useCurrentUser()
  const supabase = createClient()

  useEffect(() => {
    if (!mounted || user?.role !== 'admin') return

    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('consolidated_reports')
          .select('*')
          .order('report_date', { ascending: false })
        setReports(data || [])
      } catch (error) {
        console.error('Error fetching consolidated reports:', error)
      }
    }

    fetch()
  }, [user, mounted, supabase])

  return { reports }
}