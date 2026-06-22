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
import { PageHeader } from '@/components/page-header'
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
      <PageHeader
        eyebrow="Records"
        title="Monthly entries"
        description="One record per product per month — the revenue earned and the costs behind it."
        action={
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
        }
      />

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
