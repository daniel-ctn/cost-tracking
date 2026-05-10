'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Calendar01Icon, PackageIcon } from '@hugeicons/core-free-icons'
import { deleteMonthlyRecord } from '@/app/actions'
import { useRouter } from 'next/navigation'

type Record = {
  id: number
  productName: string | null
  month: number
  year: number
  totalRevenue: string
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function EntriesList({ records }: { records: Record[] }) {
  const router = useRouter()

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent ring-1 ring-white/[0.06] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.04] hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground pl-6">
              Product
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
              Period
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
              Revenue
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[60px] pr-6">
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow
              key={r.id}
              className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            >
              <TableCell className="pl-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/10">
                    <HugeiconsIcon icon={PackageIcon} className="size-4 text-violet-400" />
                  </div>
                  <span className="font-medium">
                    {r.productName ?? (
                      <span className="text-white/[0.15]">Unknown</span>
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Calendar01Icon} className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {months[r.month - 1]} {r.year}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(Number(r.totalRevenue))}
                </span>
              </TableCell>
              <TableCell className="pr-6">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={async () => {
                    await deleteMonthlyRecord(r.id)
                    router.refresh()
                  }}
                  className="hover:bg-red-500/10 hover:text-red-400"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
