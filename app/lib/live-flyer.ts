import sharp from 'sharp'

const WIDTH = 1728
const HEIGHT = 2304

const AUTO_TEMPLATE_IDS = ['1', '2', '3', '4', '5'] as const

type TemplateId = (typeof AUTO_TEMPLATE_IDS)[number]

type RenderInput = {
  topic: string
  liveDate: string
  requestedTemplateId?: string | null
  templateBuffer?: Buffer
}

type RenderResult = {
  buffer: Buffer
  templateId: TemplateId
  width: number
  height: number
}

type Rect = { x: number; y: number; width: number; height: number; opacity?: number }

type TemplateSpec = {
  erase: Rect[]
  panel: Rect
  topicY: number
  dateY: number
  topicColor: string
  accentColor: string
}

const TEMPLATE_SPECS: Record<TemplateId, TemplateSpec> = {
  '1': {
    erase: [{ x: 70, y: 1450, width: 1588, height: 700, opacity: 0.96 }],
    panel: { x: 90, y: 1450, width: 1548, height: 690, opacity: 0.95 },
    topicY: 1560,
    dateY: 1990,
    topicColor: '#ffffff',
    accentColor: '#19d6cf',
  },
  '2': {
    erase: [{ x: 70, y: 1450, width: 1588, height: 700, opacity: 0.96 }],
    panel: { x: 90, y: 1450, width: 1548, height: 690, opacity: 0.95 },
    topicY: 1560,
    dateY: 1990,
    topicColor: '#ffffff',
    accentColor: '#19d6cf',
  },
  '3': {
    erase: [
      { x: 820, y: 610, width: 820, height: 760, opacity: 0.97 },
      { x: 760, y: 1730, width: 900, height: 330, opacity: 0.97 },
    ],
    panel: { x: 820, y: 610, width: 820, height: 760, opacity: 0.96 },
    topicY: 800,
    dateY: 1780,
    topicColor: '#ffffff',
    accentColor: '#18c7c0',
  },
  '4': {
    erase: [
      { x: 120, y: 480, width: 1488, height: 620, opacity: 0.96 },
      { x: 250, y: 1820, width: 1228, height: 300, opacity: 0.96 },
    ],
    panel: { x: 120, y: 480, width: 1488, height: 620, opacity: 0.95 },
    topicY: 650,
    dateY: 1840,
    topicColor: '#ffffff',
    accentColor: '#18c7c0',
  },
  '5': {
    erase: [{ x: 70, y: 1430, width: 1588, height: 700, opacity: 0.96 }],
    panel: { x: 90, y: 1430, width: 1548, height: 690, opacity: 0.95 },
    topicY: 1545,
    dateY: 1980,
    topicColor: '#ffffff',
    accentColor: '#17c8c4',
  },
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeTopic(value: string) {
  return value
    .replace(/^live\s*[·:\-–—]?\s*/i, '')
    .replace(/^transmisi[oó]n\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hashText(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}


export function nextLiveTemplateId(current: string | null | undefined): TemplateId {
  const index = AUTO_TEMPLATE_IDS.indexOf(current as TemplateId)
  if (index < 0) return AUTO_TEMPLATE_IDS[0]
  return AUTO_TEMPLATE_IDS[(index + 1) % AUTO_TEMPLATE_IDS.length]
}

export function resolveLiveTemplateId(topic: string, liveDate: string, requestedTemplateId?: string | null): TemplateId {
  if (requestedTemplateId && requestedTemplateId !== 'auto' && AUTO_TEMPLATE_IDS.includes(requestedTemplateId as TemplateId)) {
    return requestedTemplateId as TemplateId
  }
  const seed = `${normalizeTopic(topic)}|${liveDate}`
  return AUTO_TEMPLATE_IDS[hashText(seed) % AUTO_TEMPLATE_IDS.length]
}

function spanishDateLabel(dateText: string) {
  const date = new Date(`${dateText}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return dateText
  const weekdays = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
  return `${weekdays[date.getUTCDay()]} ${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}

function wrapTopic(topic: string, maxChars: number) {
  const words = normalizeTopic(topic).toUpperCase().split(' ').filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars || !current) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 4)
}

function topicLayout(topic: string, spec: TemplateSpec) {
  const cleaned = normalizeTopic(topic)
  const maxChars = cleaned.length > 44 ? 18 : cleaned.length > 28 ? 22 : 26
  const lines = wrapTopic(cleaned, maxChars)
  const fontSize = lines.length >= 4 ? 100 : lines.length === 3 ? 116 : lines.length === 2 ? 132 : 148
  const lineHeight = Math.round(fontSize * 1.02)
  const availableWidth = Math.max(700, spec.panel.width - 120)
  return { lines, fontSize, lineHeight, availableWidth }
}

function rectSvg(rect: Rect) {
  const opacity = rect.opacity ?? 1
  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="24" fill="#05090b" fill-opacity="${opacity}"/>`
}

function renderOverlay(topic: string, liveDate: string, templateId: TemplateId) {
  const spec = TEMPLATE_SPECS[templateId]
  const layout = topicLayout(topic, spec)
  const escapedLines = layout.lines.map(escapeXml)
  const topicText = escapedLines.map((line, index) => (
    `<text x="${spec.panel.x + spec.panel.width / 2}" y="${spec.topicY + index * layout.lineHeight}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${layout.fontSize}" font-weight="900" fill="${spec.topicColor}" stroke="#000000" stroke-opacity="0.28" stroke-width="2">${line}</text>`
  )).join('')

  const dateLabel = escapeXml(spanishDateLabel(liveDate))
  const dateBlockY = templateId === '3' || templateId === '4' ? spec.dateY : spec.dateY

  return Buffer.from(`
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${spec.erase.map(rectSvg).join('')}
    ${rectSvg(spec.panel)}
    <text x="${spec.panel.x + spec.panel.width / 2}" y="${spec.topicY - 78}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800" letter-spacing="5" fill="${spec.accentColor}">TRANSMISIÓN</text>
    ${topicText}
    <rect x="${spec.panel.x + 120}" y="${dateBlockY - 96}" width="${spec.panel.width - 240}" height="150" rx="36" fill="${spec.accentColor}" fill-opacity="0.96"/>
    <text x="${spec.panel.x + spec.panel.width / 2}" y="${dateBlockY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="900" fill="#061012">${dateLabel} · 11 AM</text>
    <text x="${spec.panel.x + spec.panel.width / 2}" y="${dateBlockY + 110}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="800" letter-spacing="3" fill="#ffffff">LIVE · EAGLES GEAR SOLUTIONS</text>
  </svg>`)
}

export async function renderLiveFlyer(input: RenderInput): Promise<RenderResult> {
  const templateId = resolveLiveTemplateId(input.topic, input.liveDate, input.requestedTemplateId)
  if (!input.templateBuffer?.length) throw new Error('No se pudo cargar la plantilla base del Live.')
  const overlay = renderOverlay(input.topic, input.liveDate, templateId)

  const buffer = await sharp(input.templateBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 8, quality: 95 })
    .toBuffer()

  return { buffer, templateId, width: WIDTH, height: HEIGHT }
}
