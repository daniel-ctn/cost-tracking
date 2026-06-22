import { getProducts, getUserSettings } from '@/app/actions'
import { ProductsTable } from '@/components/products-table'
import { AddProductDialog } from '@/components/add-product-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { PackageIcon } from '@hugeicons/core-free-icons'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getUserSettings(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Manage"
        title="Products"
        description="Each product carries its own revenue, costs, and profit margin."
        action={<AddProductDialog />}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="No products yet"
          description="Add your first product to start tracking its costs and revenue."
          action={<AddProductDialog />}
        />
      ) : (
        <ProductsTable products={products} currency={settings.currency} />
      )}
    </div>
  )
}
