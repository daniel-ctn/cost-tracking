import { getMonthlyRecords, getProducts } from "@/app/actions"
import { EntriesList } from "@/components/entries-list"
import { AddEntryDialog } from "@/components/add-entry-dialog"

export const dynamic = "force-dynamic"

export default async function EntriesPage() {
  const [records, products] = await Promise.all([
    getMonthlyRecords(),
    getProducts(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monthly Entries</h1>
        {products.length > 0 && <AddEntryDialog products={products} />}
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Add products first before creating entries.
        </p>
      ) : records.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No entries yet. Click &quot;Add Entry&quot; to get started.
        </p>
      ) : (
        <EntriesList records={records} />
      )}
    </div>
  )
}
