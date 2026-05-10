import { getProducts } from "@/app/actions"
import { ProductsTable } from "@/components/products-table"
import { AddProductDialog } from "@/components/add-product-dialog"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <AddProductDialog />
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No products yet. Add your first product to get started.
        </p>
      ) : (
        <ProductsTable products={products} />
      )}
    </div>
  )
}
