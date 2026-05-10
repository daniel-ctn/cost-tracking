import { getMonthlyRecords, getProducts } from '@/app/actions'
import { EntriesList } from '@/components/entries-list'
import { AddEntryDialog } from '@/components/add-entry-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon } from '@hugeicons/core-free-icons'

export const dynamic = 'force-dynamic'

export default async function EntriesPage() {
  const [records, products] = await Promise.all([
    getMonthlyRecords(),
    getProducts(),
  ])

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Records</p>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Entries</h1>
        </div>
        {products.length > 0 && <AddEntryDialog products={products} />}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center size-20 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.04] mb-6">
            <HugeiconsIcon icon={File01Icon} className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add products first before creating monthly entries.
          </p>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center size-20 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.04] mb-6">
            <HugeiconsIcon icon={File01Icon} className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No entries yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Click &quot;Add Entry&quot; to record your first monthly data.
          </p>
        </div>
      ) : (
        <EntriesList records={records} />
      )}
    </div>
  )
}
