import { create } from 'zustand'
import { Lead } from '@/lib/types'

type StatusFilter = Lead['lead_status'] | 'all'
type PlatformFilter = Lead['platform'] | 'all'

type LeadStore = {
  statusFilter: StatusFilter
  platformFilter: PlatformFilter
  search: string
  setStatusFilter: (status: StatusFilter) => void
  setPlatformFilter: (platform: PlatformFilter) => void
  setSearch: (search: string) => void
  resetFilters: () => void
}

export const useLeadStore = create<LeadStore>((set) => ({
  statusFilter: 'all',
  platformFilter: 'all',
  search: '',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPlatformFilter: (platformFilter) => set({ platformFilter }),
  setSearch: (search) => set({ search }),
  resetFilters: () => set({ statusFilter: 'all', platformFilter: 'all', search: '' }),
}))
