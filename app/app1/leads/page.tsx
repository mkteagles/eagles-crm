import { Filters } from '@/components/Filters'
import { LeadsTable } from '@/components/LeadsTable'

export default function LeadsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Leads</h1>
      <Filters />
      <LeadsTable />
    </div>
  )
}
