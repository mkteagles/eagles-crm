import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { CopyRequest } from '@/lib/copy-center'

export const maxDuration = 60

const TEST_GROUP_CODE = 'PRUEBA_VICTORIA'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 16 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])
const WORKSHOP_APPROVER_EMAIL = 'marcosc@eagles.com'

type AssetRecord = {
  id: string
  copy_request_ref: string | null
  asset_type: string
  storage_bucket: string
  storage_path: string
  public_url: string | null
  version: number
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type GroupRecord = {
  id: string
  code: string
  name: string
  group_jid: string
  purpose: string
  default_send_time_1: string | null
  default_send_time_2: string | null
  instance_id: string
  whatsapp_instances: {
    id: string
    code: string
    name: string
    instance_name: string
    base_url: string
    phone_label: string | null
  } | null
}

function safeFileName(name: string) {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return base || 'archivo'
}


function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function isWorkshopOctober(item: CopyRequest) {
  const topic = normalizeText(item.product_topic || '')
  return item.campaign_month === '2026-10' && topic.includes('workshop')
}

async function getSessionContext(id: string) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, { status: 401 }) }
  }

  const [{ data: copyRequest, error: requestError }, { data: profile }] = await Promise.all([
    supabase.from('copy_requests').select('*').eq('id', id).maybeSingle(),
    supabase.from('user_profiles').select('role,email').eq('id', authData.user.id).maybeSingle(),
  ])

  if (requestError || !copyRequest) {
    return { error: NextResponse.json({ error: 'No se encontró la solicitud de copy.' }, { status: 404 }) }
  }

  const item = copyRequest as CopyRequest
  const isAdmin = profile?.role === 'admin'
  const userEmail = String(profile?.email || authData.user.email || '').trim().toLowerCase()
  const workshopOnlyMarcos = isWorkshopOctober(item)
  const canWork = isAdmin || item.assigned_to === authData.user.id || item.requested_by === authData.user.id
  const canReview = workshopOnlyMarcos
    ? userEmail === WORKSHOP_APPROVER_EMAIL
    : isAdmin || item.reviewer_id === authData.user.id

  return {
    supabase,
    userId: authData.user.id,
    item,
    canWork,
    canReview,
    workshopOnlyMarcos,
    userEmail,
  }
}

async function getTestGroup(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('whatsapp_groups')
    .select(`
      id,
      code,
      name,
      group_jid,
      purpose,
      default_send_time_1,
      default_send_time_2,
      instance_id,
      whatsapp_instances (
        id,
        code,
        name,
        instance_name,
        base_url,
        phone_label
      )
    `)
    .eq('code', TEST_GROUP_CODE)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as unknown as GroupRecord | null
}

async function getSelectedAsset(admin: ReturnType<typeof createAdminClient>, copyId: string) {
  const { data, error } = await admin
    .from('marketing_copy_assets')
    .select('*')
    .eq('copy_request_ref', copyId)
    .in('asset_type', ['image', 'video'])
    .eq('status', 'selected')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as AssetRecord | null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const session = await getSessionContext(id)
  if ('error' in session) return session.error

  if (!session.canWork && !session.canReview) {
    return NextResponse.json({ error: 'No tienes permiso para ver la vista previa de este copy.' }, { status: 403 })
  }

  try {
    const admin = createAdminClient()
    const [asset, group] = await Promise.all([
      getSelectedAsset(admin, id),
      getTestGroup(admin),
    ])

    return NextResponse.json({
      asset,
      destination: group
        ? {
            groupCode: group.code,
            groupName: group.name,
            groupJid: group.group_jid,
            purpose: group.purpose,
            defaultSendTime1: group.default_send_time_1,
            defaultSendTime2: group.default_send_time_2,
            instanceCode: group.whatsapp_instances?.code || null,
            instanceName: group.whatsapp_instances?.instance_name || null,
            phoneLabel: group.whatsapp_instances?.phone_label || group.whatsapp_instances?.name || null,
          }
        : null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar la vista previa de WhatsApp.' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const session = await getSessionContext(id)
  if ('error' in session) return session.error

  const payload = await request.json().catch(() => ({})) as {
    action?: string
    caption?: string
    fileName?: string
    fileType?: string
    fileSize?: number
    storagePath?: string
    version?: number
    assetType?: 'image' | 'video'
  }

  if (payload.action === 'prepare-upload') {
    if (!session.canWork && !session.canReview) {
      return NextResponse.json({ error: 'No tienes permiso para subir contenido a este copy.' }, { status: 403 })
    }

    const fileName = String(payload.fileName || '').trim()
    const fileType = String(payload.fileType || '').trim().toLowerCase()
    const fileSize = Number(payload.fileSize || 0)
    const isImage = ALLOWED_IMAGE_TYPES.has(fileType)
    const isVideo = ALLOWED_VIDEO_TYPES.has(fileType)

    if (!fileName || !fileSize || (!isImage && !isVideo)) {
      return NextResponse.json({ error: 'Selecciona un archivo JPG, PNG, WEBP, MP4 o MOV válido.' }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (fileSize > maxSize) {
      return NextResponse.json({ error: isVideo ? 'El video no puede pesar más de 16 MB.' : 'La imagen no puede pesar más de 10 MB.' }, { status: 400 })
    }

    try {
      const admin = createAdminClient()
      const bucket = 'marketing-assets'
      const { data: versionRows, error: versionError } = await admin
        .from('marketing_copy_assets')
        .select('version')
        .eq('copy_request_ref', id)
        .in('asset_type', ['image', 'video'])
        .order('version', { ascending: false })
        .limit(1)

      if (versionError) throw versionError
      const version = Number(versionRows?.[0]?.version || 0) + 1
      const storagePath = `copy-requests/${id}/v${version}-${Date.now()}-${safeFileName(fileName)}`
      const { data: signedData, error: signedError } = await admin.storage
        .from(bucket)
        .createSignedUploadUrl(storagePath)

      if (signedError || !signedData?.token) throw signedError || new Error('No se pudo crear la carga segura.')

      return NextResponse.json({
        upload: {
          bucket,
          storagePath,
          token: signedData.token,
          version,
          assetType: isVideo ? 'video' : 'image',
        },
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'No se pudo preparar la carga.' },
        { status: 500 },
      )
    }
  }

  if (payload.action === 'finalize-upload') {
    if (!session.canWork && !session.canReview) {
      return NextResponse.json({ error: 'No tienes permiso para guardar contenido en este copy.' }, { status: 403 })
    }

    const fileName = String(payload.fileName || '').trim()
    const fileType = String(payload.fileType || '').trim().toLowerCase()
    const fileSize = Number(payload.fileSize || 0)
    const storagePath = String(payload.storagePath || '').trim()
    const version = Number(payload.version || 0)
    const assetType = payload.assetType
    const isImage = assetType === 'image' && ALLOWED_IMAGE_TYPES.has(fileType)
    const isVideo = assetType === 'video' && ALLOWED_VIDEO_TYPES.has(fileType)

    if (!storagePath.startsWith(`copy-requests/${id}/`) || !version || (!isImage && !isVideo)) {
      return NextResponse.json({ error: 'Los datos del archivo no son válidos.' }, { status: 400 })
    }

    try {
      const admin = createAdminClient()
      const bucket = 'marketing-assets'
      const { data: publicData } = admin.storage.from(bucket).getPublicUrl(storagePath)

      await admin
        .from('marketing_copy_assets')
        .update({ status: 'ready' })
        .eq('copy_request_ref', id)
        .in('asset_type', ['image', 'video'])
        .eq('status', 'selected')

      const { data: asset, error: assetError } = await admin
        .from('marketing_copy_assets')
        .insert({
          copy_request_ref: id,
          asset_type: assetType,
          storage_bucket: bucket,
          storage_path: storagePath,
          public_url: publicData.publicUrl,
          version,
          status: 'selected',
          created_by: session.userId,
          metadata: {
            original_name: fileName,
            mime_type: fileType,
            size: fileSize,
            source: 'crm_signed_upload',
            media_type: assetType,
          },
        })
        .select('*')
        .single()

      if (assetError) throw assetError
      return NextResponse.json({ asset })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'No se pudo guardar el contenido.' },
        { status: 500 },
      )
    }
  }



  if (payload.action !== 'approve-send-test') {
    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 })
  }

  if (!session.canReview) {
    return NextResponse.json({
      error: session.workshopOnlyMarcos
        ? 'Esta Workshop solo puede ser revisada y aprobada por marcosc@eagles.com.'
        : 'No tienes permiso para aprobar y enviar esta prueba.',
    }, { status: 403 })
  }

  const caption = String(payload.caption || session.item.final_copy || session.item.generated_copy || '').trim()
  if (!caption) {
    return NextResponse.json({ error: 'El copy está vacío.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const [asset, group] = await Promise.all([
      getSelectedAsset(admin, id),
      getTestGroup(admin),
    ])

    if (!asset?.public_url) {
      return NextResponse.json({ error: 'Falta subir y seleccionar una imagen o video para aprobar.' }, { status: 400 })
    }

    if (!group?.whatsapp_instances) {
      return NextResponse.json({ error: 'No se encontró el destino PRUEBA_VICTORIA o su instancia WORKSHOP.' }, { status: 500 })
    }

    const evolutionApiKey = process.env.EVOLUTION_API_KEY?.trim()
    if (!evolutionApiKey) {
      return NextResponse.json(
        { error: 'Falta configurar EVOLUTION_API_KEY en Vercel del CRM.' },
        { status: 503 },
      )
    }

    const now = new Date().toISOString()
    const { data: delivery, error: deliveryError } = await admin
      .from('whatsapp_deliveries')
      .insert({
        copy_request_ref: id,
        asset_id: asset.id,
        instance_id: group.instance_id,
        group_id: group.id,
        caption,
        scheduled_at: now,
        status: 'sending',
        approved_by: session.userId,
        approved_at: now,
      })
      .select('*')
      .single()

    if (deliveryError) throw deliveryError

    try {
      const endpoint = `${group.whatsapp_instances.base_url.replace(/\/$/, '')}/message/sendMedia/${encodeURIComponent(group.whatsapp_instances.instance_name)}`
      const evolutionResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: evolutionApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          number: group.group_jid,
          mediatype: asset.asset_type === 'video' ? 'video' : 'image',
          mimetype: String(asset.metadata?.mime_type || (
            asset.asset_type === 'video'
              ? 'video/mp4'
              : asset.public_url.toLowerCase().includes('.png')
                ? 'image/png'
                : asset.public_url.toLowerCase().includes('.webp')
                  ? 'image/webp'
                  : 'image/jpeg'
          )),
          media: asset.public_url,
          caption,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(45000),
      })

      const evolutionPayload: unknown = await evolutionResponse.json().catch(async () => ({
        raw: await evolutionResponse.text().catch(() => ''),
      }))

      if (!evolutionResponse.ok) {
        throw new Error(`Evolution respondió con estado ${evolutionResponse.status}.`)
      }

      const responseObject = evolutionPayload && typeof evolutionPayload === 'object'
        ? evolutionPayload as Record<string, unknown>
        : {}
      const keyObject = responseObject.key && typeof responseObject.key === 'object'
        ? responseObject.key as Record<string, unknown>
        : {}
      const messageId = String(keyObject.id || responseObject.messageId || responseObject.id || '').trim() || null

      await admin
        .from('whatsapp_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          evolution_message_id: messageId,
          response_payload: evolutionPayload,
          error_message: null,
        })
        .eq('id', delivery.id)

      const { data: updatedCopy, error: updateCopyError } = await session.supabase
        .from('copy_requests')
        .update({
          final_copy: caption,
          status: 'approved',
          feedback: null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (updateCopyError) throw updateCopyError

      return NextResponse.json({
        request: updatedCopy,
        delivery: {
          ...delivery,
          status: 'sent',
          sent_at: new Date().toISOString(),
          evolution_message_id: messageId,
        },
        destination: {
          groupCode: group.code,
          groupName: group.name,
          instanceName: group.whatsapp_instances.instance_name,
        },
      })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'No se pudo enviar por Evolution.'
      await admin
        .from('whatsapp_deliveries')
        .update({
          status: 'failed',
          error_message: message,
          retry_count: Number(delivery.retry_count || 0) + 1,
        })
        .eq('id', delivery.id)

      return NextResponse.json({ error: message }, { status: 502 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo preparar el envío de prueba.' },
      { status: 500 },
    )
  }
}
