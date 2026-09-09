import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const BUCKET = 'report-evidence'
const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function safeFileName(name: string) {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return cleaned || 'evidencia'
}

function mexicoDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((item) => item.type === 'year')?.value || '1970'
  const month = parts.find((item) => item.type === 'month')?.value || '01'
  const day = parts.find((item) => item.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function permissions(profile: { role?: string | null; full_name?: string | null; email?: string | null }) {
  const name = normalize(String(profile.full_name || ''))
  const email = normalize(String(profile.email || ''))

  const isVictoria = name.includes('victoria') || email.includes('victoria')
  const isNancy = name.includes('nancy') || email.includes('nancy')
  const isJonathan = name.includes('jonathan') || email.includes('jonathan')
  const isLalo =
    name.includes('lalo') ||
    name.includes('eduardo') ||
    email.includes('lalo') ||
    email.includes('eduardo')
  const isLuis = name.includes('luis') || email.includes('luis')
  const isMarcos = name.includes('marcos') || email === 'marcosc@eagles.com'
  const isUrsula = name.includes('ursula') || email === 'ursula@eagles.com'
  const viewerNamed = isNancy || isJonathan || isLalo

  return {
    canUpload: profile.role === 'executor' || isLuis || isMarcos || isVictoria || isUrsula,
    canViewAll: profile.role === 'admin' || isVictoria || viewerNamed,
    canConsolidate: isVictoria,
    isVictoria,
  }
}

async function sessionContext() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id,full_name,email,role')
    .eq('id', authData.user.id)
    .maybeSingle()

  const effectiveProfile = {
    id: authData.user.id,
    full_name: profile?.full_name || authData.user.user_metadata?.full_name || '',
    email: profile?.email || authData.user.email || '',
    role: profile?.role || 'executor',
  }

  return {
    userId: authData.user.id,
    profile: effectiveProfile,
    permissions: permissions(effectiveProfile),
  }
}


type ActivityOwnerContext = {
  ids: Set<string>
  aliases: Set<string>
}

async function activityOwnerContext(
  admin: ReturnType<typeof createAdminClient>,
  session: { userId: string; profile: { full_name?: string | null; email?: string | null } },
): Promise<ActivityOwnerContext> {
  const currentName = normalize(String(session.profile.full_name || ''))
  const currentEmail = normalize(String(session.profile.email || ''))

  const ids = new Set<string>([session.userId])
  const aliases = new Set<string>()
  if (currentName) aliases.add(currentName)
  if (currentEmail) aliases.add(currentEmail)

  const { data: profiles, error } = await admin
    .from('user_profiles')
    .select('id,full_name,email')

  if (error) throw error

  for (const profile of profiles || []) {
    const profileName = normalize(String(profile.full_name || ''))
    const profileEmail = normalize(String(profile.email || ''))

    // Compatibilidad con cuentas duplicadas/antiguas del mismo integrante.
    // Varias actividades históricas quedaron ligadas a otro UUID aunque en
    // el CRM se muestran con el mismo nombre (por ejemplo, Victoria).
    if (
      (currentEmail && profileEmail === currentEmail) ||
      (currentName && profileName === currentName)
    ) {
      ids.add(String(profile.id))
    }
  }

  return { ids, aliases }
}

function activityBelongsToUser(assignedTo: unknown, owner: ActivityOwnerContext) {
  const raw = String(assignedTo || '').trim()
  if (!raw) return false
  if (owner.ids.has(raw)) return true
  return owner.aliases.has(normalize(raw))
}

async function cleanupExpiredEvidence() {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: expired, error } = await admin
    .from('report_evidence')
    .select('id,storage_path')
    .lte('expires_at', nowIso)
    .limit(200)

  if (error) throw error
  if (!expired?.length) return 0

  const paths = expired.map((item) => String(item.storage_path)).filter(Boolean)
  if (paths.length) {
    const { error: storageError } = await admin.storage.from(BUCKET).remove(paths)
    if (storageError) throw storageError
  }

  const ids = expired.map((item) => item.id)
  const { error: deleteError } = await admin.from('report_evidence').delete().in('id', ids)
  if (deleteError) throw deleteError

  return ids.length
}

export async function GET() {
  const session = await sessionContext()
  if ('error' in session) return session.error

  try {
    // Limpieza oportunista: cada vez que alguien abre Reportes se eliminan
    // físicamente los archivos que ya cumplieron 3 días.
    await cleanupExpiredEvidence().catch((error) => {
      console.error('No se pudo ejecutar limpieza oportunista:', error)
    })

    const admin = createAdminClient()
    const owner = await activityOwnerContext(admin, session)

    const { data: todayActivityRows, error: todayActivitiesError } = await admin
      .from('activities')
      .select('id,title,status,due_date,updated_at,assigned_to')
      .eq('due_date', mexicoDate())
      .order('updated_at', { ascending: false })
      .limit(250)

    if (todayActivitiesError) throw todayActivitiesError

    const todayActivities = (todayActivityRows || [])
      .filter((activity) => activityBelongsToUser(activity.assigned_to, owner))
      .map((activity) => ({
        id: activity.id,
        title: activity.title,
        status: activity.status,
        due_date: activity.due_date,
        updated_at: activity.updated_at,
      }))

    let query = admin
      .from('report_evidence')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(250)

    if (!session.permissions.canViewAll) {
      query = query.eq('user_id', session.userId)
    }

    const { data: evidence, error } = await query
    if (error) throw error

    const userIds = [...new Set((evidence || []).map((item) => item.user_id).filter(Boolean))]
    const activityIds = [...new Set((evidence || []).map((item) => item.activity_id).filter(Boolean))]

    const [profilesResponse, activitiesResponse] = await Promise.all([
      userIds.length
        ? admin.from('user_profiles').select('id,full_name,email').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      activityIds.length
        ? admin.from('activities').select('id,title,status,due_date').in('id', activityIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (profilesResponse.error) throw profilesResponse.error
    if (activitiesResponse.error) throw activitiesResponse.error

    const profiles = new Map((profilesResponse.data || []).map((item) => [String(item.id), item]))
    const activities = new Map((activitiesResponse.data || []).map((item) => [String(item.id), item]))

    const enriched = await Promise.all((evidence || []).map(async (item) => {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(item.storage_path, 15 * 60)
      return {
        ...item,
        signed_url: signed?.signedUrl || null,
        user_name: profiles.get(String(item.user_id))?.full_name || 'Usuario',
        activity_title: activities.get(String(item.activity_id))?.title || 'Actividad',
        activity_status: activities.get(String(item.activity_id))?.status || null,
        activity_due_date: activities.get(String(item.activity_id))?.due_date || null,
      }
    }))

    return NextResponse.json({
      evidence: enriched,
      activities: todayActivities,
      permissions: session.permissions,
      retention_days: 3,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron cargar las evidencias.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const session = await sessionContext()
  if ('error' in session) return session.error

  const payload = await request.json().catch(() => ({})) as {
    action?: string
    activityId?: number | string
    fileName?: string
    fileType?: string
    fileSize?: number
    storagePath?: string
    note?: string
  }

  if (!session.permissions.canUpload) {
    return NextResponse.json({ error: 'Tu usuario tiene acceso de consulta, pero no de carga de evidencias.' }, { status: 403 })
  }

  try {
    await cleanupExpiredEvidence().catch(() => undefined)
    const admin = createAdminClient()
    const activityId = Number(payload.activityId || 0)

    if (!activityId) {
      return NextResponse.json({ error: 'Selecciona una actividad para asociar la evidencia.' }, { status: 400 })
    }

    const { data: activity, error: activityError } = await admin
      .from('activities')
      .select('id,title,assigned_to,due_date')
      .eq('id', activityId)
      .maybeSingle()

    if (activityError || !activity) {
      return NextResponse.json({ error: 'No se encontró la actividad.' }, { status: 404 })
    }

    const owner = await activityOwnerContext(admin, session)
    if (!activityBelongsToUser(activity.assigned_to, owner)) {
      return NextResponse.json({ error: 'Solo puedes subir evidencia a actividades asignadas a ti.' }, { status: 403 })
    }

    if (String(activity.due_date || '').slice(0, 10) !== mexicoDate()) {
      return NextResponse.json({ error: 'Solo puedes subir evidencia de actividades del día de hoy.' }, { status: 400 })
    }

    if (payload.action === 'prepare-upload') {
      const fileName = String(payload.fileName || '').trim()
      const fileType = String(payload.fileType || '').trim().toLowerCase()
      const fileSize = Number(payload.fileSize || 0)

      if (!fileName || !ALLOWED_TYPES.has(fileType) || !fileSize) {
        return NextResponse.json({ error: 'Selecciona una imagen JPG/PNG/WEBP o un PDF válido.' }, { status: 400 })
      }

      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Cada evidencia puede pesar máximo 8 MB.' }, { status: 400 })
      }

      const storagePath = `reports/${session.userId}/${mexicoDate()}/${crypto.randomUUID()}-${safeFileName(fileName)}`
      const { data: signed, error: signedError } = await admin.storage.from(BUCKET).createSignedUploadUrl(storagePath)
      if (signedError || !signed?.token) throw signedError || new Error('No se pudo preparar la carga.')

      return NextResponse.json({
        upload: {
          bucket: BUCKET,
          storagePath,
          token: signed.token,
        },
      })
    }

    if (payload.action === 'finalize-upload') {
      const fileName = String(payload.fileName || '').trim()
      const fileType = String(payload.fileType || '').trim().toLowerCase()
      const fileSize = Number(payload.fileSize || 0)
      const storagePath = String(payload.storagePath || '').trim()
      const note = String(payload.note || '').trim().slice(0, 500)

      if (!storagePath.startsWith(`reports/${session.userId}/`)) {
        return NextResponse.json({ error: 'La ruta del archivo no es válida.' }, { status: 400 })
      }
      if (!ALLOWED_TYPES.has(fileType) || fileSize > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'El archivo no cumple los límites permitidos.' }, { status: 400 })
      }

      const { data: evidence, error: insertError } = await admin
        .from('report_evidence')
        .insert({
          user_id: session.userId,
          activity_id: activityId,
          report_date: mexicoDate(),
          note: note || null,
          storage_bucket: BUCKET,
          storage_path: storagePath,
          original_name: fileName,
          mime_type: fileType,
          size_bytes: fileSize,
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('*')
        .single()

      if (insertError) throw insertError
      return NextResponse.json({ evidence })
    }

    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo guardar la evidencia.' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  const session = await sessionContext()
  if ('error' in session) return session.error

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id.' }, { status: 400 })

  try {
    const admin = createAdminClient()
    const { data: evidence, error } = await admin.from('report_evidence').select('*').eq('id', id).maybeSingle()
    if (error || !evidence) return NextResponse.json({ error: 'No se encontró la evidencia.' }, { status: 404 })

    const canDelete = evidence.user_id === session.userId || session.permissions.isVictoria
    if (!canDelete) return NextResponse.json({ error: 'No tienes permiso para eliminar esta evidencia.' }, { status: 403 })

    const { error: storageError } = await admin.storage.from(BUCKET).remove([evidence.storage_path])
    if (storageError) throw storageError

    const { error: deleteError } = await admin.from('report_evidence').delete().eq('id', id)
    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar la evidencia.' },
      { status: 500 },
    )
  }
}

