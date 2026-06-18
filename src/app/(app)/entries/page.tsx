import {
  getMonthlyRecords,
  getProducts,
  getServices,
  getUserSettings,
} from '@/app/actions'
import { EntriesList } from '@/components/entries-list'
import { AddEntryButton } from '@/components/add-entry-button'
import { ImportExportBar } from '@/components/import-export-bar'
import { EmptyState } from '@/components/empty-state'
import { File01Icon } from '@hugeicons/core-free-icons'

export const dynamic = 'force-dynamic'

export default async function EntriesPage() {
  const [records, products, allServices, settings] = await Promise.all([
    getMonthlyRecords(),
    getProducts(),
    getServices(),
    getUserSettings(),
  ])
  const services = allServices
    .filter((s) => s.isActive)
    .map((s) => ({ id: s.id, name: s.name, defaultAmount: s.defaultAmount }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Records
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Monthly entries
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportBar />
          {products.length > 0 && (
            <AddEntryButton
              products={products}
              services={services}
              currency={settings.currency}
            />
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={File01Icon}
          title="No products yet"
          description="Add a product first, then record monthly revenue and costs for it."
        />
      ) : records.length === 0 ? (
        <EmptyState
          icon={File01Icon}
          title="No entries yet"
          description="Record your first month of revenue and costs to start tracking profit."
          action={
            <AddEntryButton
              products={products}
              services={services}
              currency={settings.currency}
            />
          }
        />
      ) : (
        <EntriesList
          records={records}
          products={products}
          services={services}
          currency={settings.currency}
        />
      )}
    </div>
  )
}
