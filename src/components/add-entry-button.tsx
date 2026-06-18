'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { EntryDialog, type ServiceOption } from '@/components/entry-dialog'
import type { Currency } from '@/lib/currency'

type Product = { id: number; name: string }

export function AddEntryButton({
  products,
  services,
  currency,
}: {
  products: Product[]
  services: ServiceOption[]
  currency: Currency
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
        Add entry
      </Button>
      <EntryDialog
        products={products}
        services={services}
        currency={currency}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
