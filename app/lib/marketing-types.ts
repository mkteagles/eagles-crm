// =========================================================
// ROLES
// =========================================================

export type UserRole =
  | 'admin'
  | 'executor'
  | 'viewer'


// =========================================================
// ESTADOS
// =========================================================

export type ActivityStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'


// =========================================================
// PRIORIDADES
// =========================================================

export type ActivityPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'


// =========================================================
// RECURRENCIA
// =========================================================

export type ActivityRecurrence =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'


// =========================================================
// USUARIO
// =========================================================

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}


// =========================================================
// ACTIVIDAD
// =========================================================

export interface Activity {
  id: number

  title: string

  description?: string

  status: ActivityStatus

  priority: ActivityPriority

  created_by: string

  assigned_to: string

  due_date: string

  due_time?: string | null

  completed_at?: string | null

  result_metric?: number | null

  result_notes?: string | null

  approved_by?: string | null

  approved_at?: string | null

  rejection_reason?: string | null

  lead_id?: number | null

  project?: string | null

  created_at: string

  updated_at: string

  recurrence_type?: ActivityRecurrence

  recurrence_days?: number[] | null

  recurrence_end_date?: string | null

  recurrence_group_id?: string | null
}


// =========================================================
// ACTIVIDAD CON USUARIOS
// =========================================================

export interface ActivityWithUser
  extends Activity {

  created_by_name: string

  assigned_to_name: string

  approved_by_name?: string
}


// =========================================================
// HISTORIAL
// =========================================================

export interface ActivityHistory {
  id: number

  activity_id: number

  old_status: string

  new_status: string

  changed_by: string

  changed_at: string
}


// =========================================================
// REPORTES
// =========================================================

export interface DailyReport {
  id: number

  user_id: string

  report_content: string

  report_date: string

  created_at: string

  consolidated_by?: string

  consolidated_at?: string
}


export interface ConsolidatedReport {
  id: number

  created_by: string

  report_content: string

  report_date: string

  created_at: string
}