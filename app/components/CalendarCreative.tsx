'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'

type CreativeItem = {
  id: string
  import_id?: string | null
  period_month: string
  item_number?: number | null
  category: string
  publication: string
  copy_text: string
  content_text: string
  schedule_text: string
  distribution_type: string
  responsible: string
  approved: boolean
  status_text: string
  publish_date: string | null
  publish_time: string | null
  created_at?: string
  updated_at?: string
}

type SourceImport = {
  id: string
  file_name: string
  imported_at: string
  row_count: number
  detected_period?: string | null
}

type EditForm = {
  category: string
  publication: string
  copy_text: string
  content_text: string
  schedule_text: string
  distribution_type: string
  responsible: string
  approved: boolean
  status_text: string
  publish_date: string
  publish_time: string
}

const EMPTY_FORM: EditForm = {
  category: 'Contenido',
  publication: '',
  copy_text: '',
  content_text: '',
  schedule_text: '',
  distribution_type: 'O',
  responsible: 'Ursula',
  approved: false,
  status_text: '',
  publish_date: '',
  publish_time: '',
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function getPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function displayMonth(date: Date) {
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

function clean(value: string | null | undefined) {
  return String(value || '').trim()
}

function compactTitle(item: CreativeItem) {
  const publication = clean(item.publication)
  if (publication) {
    return publication.split('·')[0].trim().slice(0, 72)
  }

  const copy = clean(item.copy_text)
  if (copy) {
    const line = copy.split('\n').find(Boolean) || copy
    return line.replace(/^[-–—•\s]+/, '').slice(0, 72)
  }

  return clean(item.category) || 'Contenido'
}

function categoryTone(category: string) {
  const value = category.toLowerCase()
  if (value.includes('tendencia')) {
    return 'border-pink-200 bg-pink-50 text-pink-800 dark:border-pink-900/70 dark:bg-pink-950/30 dark:text-pink-200'
  }
  if (value.includes('informativo')) {
    return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200'
  }
  if (value.includes('patrio')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200'
  }
  if (value.includes('entreten')) {
    return 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-200'
  }
  return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200'
}

function formFromItem(item: CreativeItem): EditForm {
  return {
    category: clean(item.category) || 'Contenido',
    publication: clean(item.publication),
    copy_text: clean(item.copy_text),
    content_text: clean(item.content_text),
    schedule_text: clean(item.schedule_text),
    distribution_type: clean(item.distribution_type),
    responsible: clean(item.responsible) || 'Ursula',
    approved: Boolean(item.approved),
    status_text: clean(item.status_text),
    publish_date: clean(item.publish_date),
    publish_time: clean(item.publish_time).slice(0, 5),
  }
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-86px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export default function CalendarCreative() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [items, setItems] = useState<CreativeItem[]>([])
  const [sourceImport, setSourceImport] = useState<SourceImport | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [isUrsula, setIsUrsula] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<CreativeItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const period = getPeriod(currentDate)

  const loadCalendar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/app1/api/creative-calendar?period=${encodeURIComponent(period)}`, {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el calendario creativo.')

      setItems(Array.isArray(data.items) ? data.items : [])
      setCanEdit(Boolean(data.canEdit))
      setIsUrsula(Boolean(data.isUrsula))
      setSourceImport(data.sourceImport || null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el calendario creativo.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const days = useMemo(() => {
    const result: Array<number | null> = []
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    const daysInMonth = getDaysInMonth(currentDate)

    for (let i = 0; i < firstDay; i += 1) result.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) result.push(day)
    return result
  }, [currentDate])

  const grouped = useMemo(() => {
    const map: Record<string, CreativeItem[]> = {}
    for (const item of items) {
      if (!item.publish_date || !item.publish_date.startsWith(`${period}-`)) continue
      if (!map[item.publish_date]) map[item.publish_date] = []
      map[item.publish_date].push(item)
    }
    return map
  }, [items, period])

  const undated = useMemo(
    () => items.filter((item) => !item.publish_date || !item.publish_date.startsWith(`${period}-`)),
    [items, period],
  )

  const approvedCount = items.filter((item) => item.approved).length
  const scheduledCount = items.filter((item) => item.publish_date).length

  function openEdit(item: CreativeItem) {
    if (!canEdit) return
    setCreating(false)
    setEditingItem(item)
    setForm(formFromItem(item))
  }

  function openCreate(date?: string) {
    if (!canEdit) return
    setEditingItem(null)
    setCreating(true)
    setForm({ ...EMPTY_FORM, publish_date: date || `${period}-01` })
  }

  async function saveItem() {
    setWorking(true)
    setError(null)
    setMessage(null)

    try {
      const endpoint = editingItem
        ? `/app1/api/creative-calendar/${editingItem.id}`
        : '/app1/api/creative-calendar'
      const response = await fetch(endpoint, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, period }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el contenido.')

      setEditingItem(null)
      setCreating(false)
      setMessage('Contenido guardado correctamente.')
      await loadCalendar()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el contenido.')
    } finally {
      setWorking(false)
    }
  }

  async function deleteItem() {
    if (!editingItem) return
    if (!window.confirm('¿Eliminar este contenido del calendario creativo?')) return

    setWorking(true)
    setError(null)

    try {
      const response = await fetch(`/app1/api/creative-calendar/${editingItem.id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el contenido.')

      setEditingItem(null)
      setMessage('Contenido eliminado.')
      await loadCalendar()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo eliminar el contenido.')
    } finally {
      setWorking(false)
    }
  }

  async function importWord(file: File) {
    setWorking(true)
    setError(null)
    setMessage(null)

    try {
      const data = new FormData()
      data.set('file', file)
      data.set('period', period)
      data.set('replace', 'true')

      const response = await fetch('/app1/api/creative-calendar/import', {
        method: 'POST',
        body: data,
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'No se pudo importar el Word.')

      const warnings = Array.isArray(body.warnings) && body.warnings.length
        ? ` ${body.warnings.join(' ')}`
        : ''
      setMessage(`Word importado: ${body.items?.length || 0} contenidos.${warnings}`)
      await loadCalendar()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo importar el Word.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setWorking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 shadow-sm dark:border-purple-900/60 dark:from-purple-950/30 dark:via-gray-950 dark:to-fuchsia-950/20">
        <div className="p-6 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
                <Sparkles size={25} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Calendario creativo</h2>
                  {isUrsula ? (
                    <span className="rounded-full bg-purple-600 px-2.5 py-1 text-xs font-bold text-white">Editor de Úrsula</span>
                  ) : null}
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Planea, edita y consulta copies, piezas, fechas, responsables y estatus. El Word fijo se puede importar mes por mes.
                </p>
              </div>
            </div>

            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void importWord(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={working}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-purple-200 bg-white px-4 text-sm font-bold text-purple-700 shadow-sm transition hover:bg-purple-50 disabled:opacity-50 dark:border-purple-800 dark:bg-gray-950 dark:text-purple-200 dark:hover:bg-purple-950/40"
                >
                  {working ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
                  Importar Word
                </button>
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-bold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700"
                >
                  <Plus size={17} /> Nuevo contenido
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Contenidos</div>
              <div className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{items.length}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Con fecha</div>
              <div className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{scheduledCount}</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">VoBo</div>
              <div className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{approvedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="rounded-xl border border-gray-200 p-2.5 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={19} />
            </button>
            <div className="min-w-52 text-center">
              <div className="text-lg font-black capitalize text-gray-950 dark:text-white">{displayMonth(currentDate)}</div>
              <div className="text-xs text-gray-500">Plan creativo mensual</div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="rounded-xl border border-gray-200 p-2.5 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ChevronRight size={19} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {sourceImport ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <FileText size={16} />
                  <span className="max-w-56 truncate">{sourceImport.file_name}</span>
                  <span className="text-xs text-gray-500">· {sourceImport.row_count} filas</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`/app1/api/creative-calendar/imports/${sourceImport.id}/download`, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Download size={16} /> Word original
                </button>
              </>
            ) : (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Sin Word cargado para este mes.
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center text-gray-500">
            <Loader2 size={26} className="mr-2 animate-spin" /> Cargando calendario…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="py-2 text-center text-xs font-black uppercase tracking-wide text-gray-400 md:text-sm">
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`blank-${index}`} className="min-h-36 rounded-2xl bg-gray-50/40 dark:bg-gray-950/20 md:min-h-44" />
                }

                const dateStr = `${period}-${String(day).padStart(2, '0')}`
                const dayItems = grouped[dateStr] || []

                return (
                  <div
                    key={dateStr}
                    className="group min-h-36 rounded-2xl border border-gray-200 bg-gray-50/70 p-2 transition hover:border-purple-300 hover:bg-purple-50/30 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-purple-800 dark:hover:bg-purple-950/10 md:min-h-44 md:p-2.5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-black text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-200">
                        {day}
                      </span>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => openCreate(dateStr)}
                          title="Agregar contenido este día"
                          className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-purple-100 hover:text-purple-700 group-hover:opacity-100 dark:hover:bg-purple-950/50 dark:hover:text-purple-200"
                        >
                          <Plus size={14} />
                        </button>
                      ) : dayItems.length ? (
                        <CalendarDays size={14} className="text-purple-500" />
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      {dayItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openEdit(item)}
                          className={`w-full rounded-xl border px-2 py-2 text-left text-[11px] leading-4 transition hover:-translate-y-0.5 hover:shadow-sm md:text-xs ${categoryTone(item.category)} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-black">{compactTitle(item)}</span>
                            {item.approved ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : null}
                          </div>
                          <div className="mt-1 truncate opacity-75">{item.category}</div>
                          {item.publish_time ? <div className="mt-0.5 text-[10px] font-semibold opacity-70">{item.publish_time.slice(0, 5)}</div> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {items.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-purple-300 bg-purple-50/60 p-8 text-center dark:border-purple-800 dark:bg-purple-950/20">
                <Upload size={30} className="mx-auto text-purple-500" />
                <h4 className="mt-3 font-black text-gray-900 dark:text-white">Este mes todavía no tiene calendario creativo</h4>
                <p className="mx-auto mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                  {canEdit
                    ? 'Úrsula puede subir el Word con el mismo formato fijo y el CRM convertirá cada fila en contenido editable.'
                    : 'Cuando Úrsula cargue el Word del mes, aparecerá aquí automáticamente.'}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {undated.length > 0 ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <CircleDot size={18} className="text-amber-600" />
            <h3 className="font-black text-amber-950 dark:text-amber-100">Por acomodar / fuera del mes</h3>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-100">{undated.length}</span>
          </div>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
            El Word no traía una fecha clara para estos elementos o la fecha pertenece a otro mes. Úrsula puede abrirlos y corregir la fecha.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {undated.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openEdit(item)}
                className="rounded-2xl border border-amber-200 bg-white p-3 text-left transition hover:border-amber-400 hover:shadow-sm dark:border-amber-900 dark:bg-gray-950"
              >
                <div className="font-bold text-gray-900 dark:text-white">{compactTitle(item)}</div>
                <div className="mt-1 text-xs text-gray-500">{item.category}{item.publish_date ? ` · ${item.publish_date}` : ' · Sin fecha'}</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/20">
        <div className="flex items-start gap-3">
          <Users size={18} className="mt-0.5 shrink-0 text-purple-600" />
          <p className="text-sm leading-6 text-purple-900 dark:text-purple-200">
            <strong>Flujo mensual:</strong> Úrsula conserva el formato Word de siempre. Al iniciar octubre, noviembre, etc., selecciona el mes, pulsa <strong>Importar Word</strong> y el CRM reemplaza ese mes con la nueva versión. Después puede editar cualquier tarjeta directamente aquí sin volver a tocar el documento.
          </p>
        </div>
      </div>

      {(editingItem || creating) ? (
        <ModalShell
          title={editingItem ? 'Editar contenido creativo' : 'Nuevo contenido creativo'}
          subtitle={editingItem ? `Elemento ${editingItem.item_number || ''} · ${displayMonth(currentDate)}` : displayMonth(currentDate)}
          onClose={() => {
            if (working) return
            setEditingItem(null)
            setCreating(false)
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Categoría</span>
              <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Publicación / pieza</span>
              <input value={form.publication} onChange={(event) => setForm((prev) => ({ ...prev, publication: event.target.value }))} placeholder="Ej. En vivo / historia / reel" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Fecha</span>
              <input type="date" value={form.publish_date} onChange={(event) => setForm((prev) => ({ ...prev, publish_date: event.target.value }))} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Hora</span>
              <input type="time" value={form.publish_time} onChange={(event) => setForm((prev) => ({ ...prev, publish_time: event.target.value }))} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Texto / Copy</span>
              <textarea rows={8} value={form.copy_text} onChange={(event) => setForm((prev) => ({ ...prev, copy_text: event.target.value }))} className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Contenido / enlaces / producción</span>
              <textarea rows={5} value={form.content_text} onChange={(event) => setForm((prev) => ({ ...prev, content_text: event.target.value }))} className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Programación original del Word</span>
              <textarea rows={3} value={form.schedule_text} onChange={(event) => setForm((prev) => ({ ...prev, schedule_text: event.target.value }))} className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Orgánica / pagada</span>
              <select value={form.distribution_type} onChange={(event) => setForm((prev) => ({ ...prev, distribution_type: event.target.value }))} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900">
                <option value="">Sin definir</option>
                <option value="O">Orgánica</option>
                <option value="P">Pagada</option>
                <option value="O/P">Orgánica y pagada</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Responsable</span>
              <input value={form.responsible} onChange={(event) => setForm((prev) => ({ ...prev, responsible: event.target.value }))} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Estatus</span>
              <input value={form.status_text} onChange={(event) => setForm((prev) => ({ ...prev, status_text: event.target.value }))} placeholder="Ej. Programado, En edición, Publicado" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
              <input type="checkbox" checked={form.approved} onChange={(event) => setForm((prev) => ({ ...prev, approved: event.target.checked }))} className="h-4 w-4 accent-purple-600" />
              <span>
                <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">VoBo aprobado</span>
                <span className="block text-xs text-gray-500">Equivale a la columna VoBo del formato.</span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {editingItem ? (
                <button
                  type="button"
                  onClick={() => void deleteItem()}
                  disabled={working}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={17} /> Eliminar
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null)
                  setCreating(false)
                }}
                disabled={working}
                className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveItem()}
                disabled={working}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {working ? <Loader2 size={17} className="animate-spin" /> : editingItem ? <Pencil size={17} /> : <Save size={17} />}
                Guardar
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  )
}
