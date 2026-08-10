export type UserRole = 'admin' | 'executor' | 'viewer'

export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Activity {
  id: number
  title: string
  description?: string
  status: ActivityStatus
  priority: ActivityPriority
  created_by: string
  assigned_to: string
  due_date: string
  completed_at?: string
  result_metric?: number
  result_notes?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  lead_id?: number
  created_at: string
  updated_at: string
}

export interface ActivityWithUser extends Activity {
  created_by_name: string
  assigned_to_name: string
  approved_by_name?: string
}

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

export interface ActivityHistory {
  id: number
  activity_id: number
  old_status: string
  new_status: string
  changed_by: string
  changed_at: string
}