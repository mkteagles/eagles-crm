import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getMexicoDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || ''

  return `${get('year')}-${get('month')}-${get('day')}`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Tu sesión venció. Vuelve a iniciar sesión.' },
      { status: 401 },
    )
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name,email,role')
    .eq('id', authData.user.id)
    .maybeSingle()

  const normalizedName = normalizeText(String(profile?.full_name || ''))
  const normalizedEmail = normalizeText(String(profile?.email || authData.user.email || ''))
  const isMarcos =
    normalizedName.includes('marcos') ||
    normalizedEmail === 'marcosc@eagles.com'

  if (!isMarcos) {
    return NextResponse.json(
      { error: 'La aprobación propia está disponible únicamente para Marcos.' },
      { status: 403 },
    )
  }

  const payload = await request.json().catch(() => ({})) as {
    ideaId?: string
    title?: string
    description?: string | null
    due_date?: string | null
    due_time?: string | null
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }

  const ideaId = String(payload.ideaId || '').trim()
  const title = String(payload.title || '').trim()

  if (!ideaId || !title) {
    return NextResponse.json(
      { error: 'Falta la idea o el título de la actividad.' },
      { status: 400 },
    )
  }

  try {
    const admin = createAdminClient()

    const { data: idea, error: ideaError } = await admin
      .from('activity_ideas')
      .select('id,title,description,created_by,assigned_to,due_date,due_time,priority,status')
      .eq('id', ideaId)
      .maybeSingle()

    if (ideaError) throw ideaError

    if (!idea) {
      return NextResponse.json(
        { error: 'No se encontró la idea.' },
        { status: 404 },
      )
    }

    if (idea.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta idea ya fue revisada.' },
        { status: 409 },
      )
    }

    if (idea.assigned_to !== authData.user.id) {
      return NextResponse.json(
        { error: 'Solo puedes aprobar por tu cuenta ideas asignadas directamente a ti.' },
        { status: 403 },
      )
    }

    const dueDate = payload.due_date || idea.due_date || getMexicoDate()
    const dueTime = payload.due_time || idea.due_time || null
    const priority = payload.priority || idea.priority || 'medium'
    const description =
      typeof payload.description === 'string'
        ? payload.description.trim() || null
        : idea.description || null

    const { data: createdActivity, error: activityError } = await admin
      .from('activities')
      .insert({
        title,
        description,
        assigned_to: authData.user.id,
        created_by: idea.created_by || authData.user.id,
        area: 'marketing',
        due_date: dueDate,
        due_time: dueTime,
        priority,
        status: 'pending',
        recurrence_type: 'none',
        recurrence_days: null,
        recurrence_end_date: null,
        recurrence_group_id: null,
      })
      .select('id')
      .single()

    if (activityError) throw activityError

    const { data: approvedIdea, error: updateError } = await admin
      .from('activity_ideas')
      .update({
        title,
        description,
        assigned_to: authData.user.id,
        due_date: dueDate,
        due_time: dueTime,
        priority,
        status: 'approved',
        reviewed_by: authData.user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (updateError || !approvedIdea) {
      await admin
        .from('activities')
        .delete()
        .eq('id', createdActivity.id)

      if (updateError) throw updateError

      return NextResponse.json(
        { error: 'La idea ya fue procesada por otra sesión.' },
        { status: 409 },
      )
    }

    return NextResponse.json({
      ok: true,
      ideaId,
      activityId: createdActivity.id,
      message: 'Idea aprobada y actividad creada.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo aprobar la idea.',
      },
      { status: 500 },
    )
  }
}
