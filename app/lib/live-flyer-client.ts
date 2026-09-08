const WIDTH = 1728
const HEIGHT = 2304

export const LIVE_FLYER_TEMPLATE_IDS = ['1', '2', '3', '4', '5'] as const
export type LiveFlyerTemplateId = (typeof LIVE_FLYER_TEMPLATE_IDS)[number]

type Rect = { x: number; y: number; width: number; height: number; opacity?: number }
type TemplateSpec = {
  erase: Rect[]
  panel: Rect
  topicY: number
  dateY: number
  topicColor: string
  accentColor: string
}

const TEMPLATE_SPECS: Record<LiveFlyerTemplateId, TemplateSpec> = {
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

function normalizeTopic(value: string) {
  return value
    .replace(/^live\s*[·:\-–—]?\s*/i, '')
    .replace(/^transmisi[oó]n\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hashText(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

export function resolveLiveTemplateIdClient(
  topic: string,
  liveDate: string,
  requestedTemplateId?: string | null,
): LiveFlyerTemplateId {
  if (
    requestedTemplateId
    && requestedTemplateId !== 'auto'
    && LIVE_FLYER_TEMPLATE_IDS.includes(requestedTemplateId as LiveFlyerTemplateId)
  ) {
    return requestedTemplateId as LiveFlyerTemplateId
  }

  const seed = `${normalizeTopic(topic)}|${liveDate}`
  return LIVE_FLYER_TEMPLATE_IDS[hashText(seed) % LIVE_FLYER_TEMPLATE_IDS.length]
}

export function nextLiveTemplateIdClient(current?: string | null): LiveFlyerTemplateId {
  const index = LIVE_FLYER_TEMPLATE_IDS.indexOf(current as LiveFlyerTemplateId)
  if (index < 0) return LIVE_FLYER_TEMPLATE_IDS[0]
  return LIVE_FLYER_TEMPLATE_IDS[(index + 1) % LIVE_FLYER_TEMPLATE_IDS.length]
}

function spanishDateLabel(dateText: string) {
  const date = new Date(`${dateText}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return dateText
  const weekdays = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
  return `${weekdays[date.getUTCDay()]} ${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar la plantilla ${src}.`))
    image.src = src
  })
}

function fillRectWithOpacity(
  context: CanvasRenderingContext2D,
  rect: Rect,
  color = '#05090b',
) {
  context.save()
  context.globalAlpha = rect.opacity ?? 1
  context.fillStyle = color
  context.fillRect(rect.x, rect.y, rect.width, rect.height)
  context.restore()
}

function fitTopicLines(
  context: CanvasRenderingContext2D,
  topic: string,
  maxWidth: number,
  maxLines = 4,
) {
  const words = normalizeTopic(topic).toUpperCase().split(' ').filter(Boolean)
  if (!words.length) return { lines: ['LIVE'], fontSize: 148 }

  let fontSize = 148
  const minFontSize = 82

  while (fontSize >= minFontSize) {
    context.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (!current || context.measureText(candidate).width <= maxWidth) {
        current = candidate
      } else {
        lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)

    if (lines.length <= maxLines && lines.every((line) => context.measureText(line).width <= maxWidth)) {
      return { lines, fontSize }
    }
    fontSize -= 8
  }

  context.font = `900 ${minFontSize}px Arial, Helvetica, sans-serif`
  const clipped = normalizeTopic(topic).toUpperCase()
  return { lines: [clipped.slice(0, 26), clipped.slice(26, 52)].filter(Boolean), fontSize: minFontSize }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

export async function buildLiveFlyerFile(
  topic: string,
  liveDate: string,
  requestedTemplateId?: string | null,
) {
  if (typeof window === 'undefined') throw new Error('El flyer automático solo puede generarse desde el navegador.')

  const templateId = resolveLiveTemplateIdClient(topic, liveDate, requestedTemplateId)
  const templateImage = await loadImage(`/live-templates/${templateId}.png`)
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Tu navegador no pudo iniciar el generador del flyer.')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(templateImage, 0, 0, WIDTH, HEIGHT)

  const spec = TEMPLATE_SPECS[templateId]
  spec.erase.forEach((rect) => fillRectWithOpacity(context, rect))
  fillRectWithOpacity(context, spec.panel)

  const centerX = spec.panel.x + spec.panel.width / 2

  context.save()
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.fillStyle = spec.accentColor
  context.font = '800 48px Arial, Helvetica, sans-serif'
  context.fillText('TRANSMISIÓN', centerX, spec.topicY - 78)

  const layout = fitTopicLines(context, topic, Math.max(650, spec.panel.width - 120))
  const lineHeight = Math.round(layout.fontSize * 1.03)
  context.fillStyle = spec.topicColor
  context.font = `900 ${layout.fontSize}px Arial, Helvetica, sans-serif`
  context.shadowColor = 'rgba(0,0,0,.35)'
  context.shadowBlur = 4
  layout.lines.forEach((line, index) => {
    context.fillText(line, centerX, spec.topicY + index * lineHeight)
  })
  context.restore()

  const dateLabel = `${spanishDateLabel(liveDate)} · 11 AM`
  const dateX = spec.panel.x + 120
  const dateWidth = spec.panel.width - 240
  const dateY = spec.dateY - 96

  context.save()
  context.fillStyle = spec.accentColor
  roundedRect(context, dateX, dateY, dateWidth, 150, 36)
  context.fill()
  context.fillStyle = '#061012'
  context.textAlign = 'center'
  context.font = '900 66px Arial, Helvetica, sans-serif'
  context.fillText(dateLabel, centerX, spec.dateY)
  context.fillStyle = '#ffffff'
  context.font = '800 38px Arial, Helvetica, sans-serif'
  context.fillText('LIVE · EAGLES GEAR SOLUTIONS', centerX, spec.dateY + 110)
  context.restore()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value)
      else reject(new Error('No se pudo convertir el flyer a PNG.'))
    }, 'image/png', 0.95)
  })

  const fileName = `live-${liveDate}-${templateId}.png`
  return {
    file: new File([blob], fileName, { type: 'image/png' }),
    templateId,
    width: WIDTH,
    height: HEIGHT,
  }
}
