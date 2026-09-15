import { inflateRawSync } from 'node:zlib'

export type ParsedCreativeCalendarRow = {
  itemNumber: number | null
  category: string
  publication: string
  copyText: string
  contentText: string
  scheduleText: string
  distributionType: string
  responsible: string
  approved: boolean
  statusText: string
  publishDate: string | null
  publishTime: string | null
  sourceCells: string[]
}

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function xmlFragmentToText(fragment: string) {
  return decodeXml(
    fragment
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:br\b[^>]*\/>/g, '\n')
      .replace(/<w:cr\b[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractZipEntry(buffer: Buffer, targetName: string) {
  const eocdSignature = 0x06054b50
  let eocd = -1
  const minOffset = Math.max(0, buffer.length - 65557)

  for (let i = buffer.length - 22; i >= minOffset; i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocd = i
      break
    }
  }

  if (eocd < 0) throw new Error('El archivo no parece ser un DOCX válido.')

  const entries = buffer.readUInt16LE(eocd + 10)
  const centralOffset = buffer.readUInt32LE(eocd + 16)
  let cursor = centralOffset

  for (let index = 0; index < entries; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('No se pudo leer la estructura interna del DOCX.')
    }

    const method = buffer.readUInt16LE(cursor + 10)
    const compressedSize = buffer.readUInt32LE(cursor + 20)
    const fileNameLength = buffer.readUInt16LE(cursor + 28)
    const extraLength = buffer.readUInt16LE(cursor + 30)
    const commentLength = buffer.readUInt16LE(cursor + 32)
    const localOffset = buffer.readUInt32LE(cursor + 42)
    const fileName = buffer
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString('utf8')

    if (fileName === targetName) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error('El DOCX contiene una entrada dañada.')
      }

      const localNameLength = buffer.readUInt16LE(localOffset + 26)
      const localExtraLength = buffer.readUInt16LE(localOffset + 28)
      const dataStart = localOffset + 30 + localNameLength + localExtraLength
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize)

      if (method === 0) return compressed
      if (method === 8) return inflateRawSync(compressed)
      throw new Error(`El DOCX usa un método de compresión no compatible (${method}).`)
    }

    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  throw new Error('No se encontró word/document.xml dentro del DOCX.')
}

function parseTables(xml: string) {
  const tables = xml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>/g) || []

  return tables.map((table) => {
    const rows = table.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || []
    return rows.map((row) => {
      const cells = row.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) || []
      return cells.map(xmlFragmentToText)
    })
  })
}

function parseYear(value: string) {
  const raw = Number.parseInt(value, 10)
  if (!Number.isFinite(raw)) return null
  return raw < 100 ? 2000 + raw : raw
}

function validDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function formatDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function extractDates(value: string) {
  const normalized = normalize(value)
  const found: string[] = []

  const matcher = /(\d{1,2})\s*[\/-]\s*([a-zñ]+|\d{1,2})\s*[\/-]\s*(\d{2,4})/gi
  for (const match of normalized.matchAll(matcher)) {
    const day = Number.parseInt(match[1], 10)
    const monthToken = match[2]
    const month = /^\d+$/.test(monthToken)
      ? Number.parseInt(monthToken, 10)
      : MONTHS[monthToken]
    const year = parseYear(match[3])

    if (month && year && validDate(year, month, day)) {
      found.push(formatDate(year, month, day))
    }
  }

  return found
}

function extractTime(value: string) {
  const match = value.match(/\b(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i)
  if (!match) return null

  let hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)
  const suffix = normalize(match[3] || '').replace(/[^apm]/g, '')

  if (suffix.startsWith('p') && hour < 12) hour += 12
  if (suffix.startsWith('a') && hour === 12) hour = 0
  if (hour > 23 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function firstNonEmptyLine(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) || ''
}

function pickPublishDate(categoryPublication: string, schedule: string, period: string) {
  const preferred = extractDates(categoryPublication)
  const scheduled = extractDates(schedule)
  const preferredSamePeriod = preferred.filter((date) => date.startsWith(`${period}-`))
  const scheduledSamePeriod = scheduled.filter((date) => date.startsWith(`${period}-`))

  // En el formato fijo, la columna Categoría/Publicación suele traer la fecha
  // principal de la pieza o del Live. La programación puede contener fechas
  // auxiliares (historia, post previo, video), por eso tiene prioridad.
  return (
    preferredSamePeriod.at(-1) ||
    scheduledSamePeriod.at(-1) ||
    preferred.at(-1) ||
    scheduled.at(-1) ||
    null
  )
}

export function parseCreativeCalendarDocx(buffer: Buffer, period: string) {
  const documentXml = extractZipEntry(buffer, 'word/document.xml').toString('utf8')
  const tables = parseTables(documentXml)
  const contentRows = tables
    .flat()
    .filter((cells) => /^\d+$/.test(String(cells[0] || '').trim()) && cells.length >= 8)

  const rows: ParsedCreativeCalendarRow[] = contentRows.map((cells) => {
    const padded = [...cells]
    while (padded.length < 9) padded.push('')

    const categoryPublication = padded[1] || ''
    const lines = categoryPublication
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const category = lines[0] || 'Contenido'
    const publication = lines.slice(1).join(' · ')
    const scheduleText = padded[4] || ''
    const publishDate = pickPublishDate(categoryPublication, scheduleText, period)

    return {
      itemNumber: Number.parseInt(padded[0], 10) || null,
      category,
      publication,
      copyText: padded[2] || '',
      contentText: padded[3] || '',
      scheduleText,
      distributionType: padded[5] || '',
      responsible: padded[6] || '',
      approved: /✅|si|sí|ok|aprob/i.test(padded[7] || ''),
      statusText: padded[8] || '',
      publishDate,
      publishTime: extractTime(scheduleText),
      sourceCells: padded.slice(0, 9),
    }
  })

  const documentText = xmlFragmentToText(documentXml)
  const normalizedText = normalize(documentText)
  let detectedPeriod: string | null = null

  for (const [monthName, monthNumber] of Object.entries(MONTHS)) {
    const match = normalizedText.match(new RegExp(`${monthName}\\s+(20\\d{2})`))
    if (match) {
      detectedPeriod = `${match[1]}-${String(monthNumber).padStart(2, '0')}`
      break
    }
  }

  return {
    rows,
    detectedPeriod,
    title: firstNonEmptyLine(documentText),
  }
}
