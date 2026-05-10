"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteMonthlyRecord } from "@/app/actions"
import { useRouter } from "next/navigation"

type Record = {
  id: number
  productName: string | null
  month: number
  year: number
  totalRevenue: string
}

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function EntriesList({ records }: { records: Record[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead className="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.productName ?? "-"}</TableCell>
            <TableCell>
              {months[r.month - 1]} {r.year}
            </TableCell>
            <TableCell>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(r.totalRevenue))}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await deleteMonthlyRecord(r.id)
                  router.refresh()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
