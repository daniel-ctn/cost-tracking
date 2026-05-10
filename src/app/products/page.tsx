import { getProducts } from '@/app/actions'
import { ProductsTable } from '@/components/products-table'
import { AddProductDialog } from '@/components/add-product-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { PackageIcon } from '@hugeicons/core-free-icons'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Manage</p>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        </div>
        <AddProductDialog />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center size-20 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.04] mb-6">
            <HugeiconsIcon icon={PackageIcon} className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add your first product to start tracking costs and revenue.
          </p>
        </div>
      ) : (
        <ProductsTable products={products} />
      )}
    </div>
  )
}
