'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon, File01Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { createMonthlyRecord } from '@/app/actions'

type Product = {
  id: number
  name: string
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export function AddEntryDialog({ products }: { products: Product[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [revenue, setRevenue] = useState('')
  const [expenseItems, setExpenseItems] = useState([
    { serviceName: '', amount: '' },
  ])
  const [saving, setSaving] = useState(false)

  const addExpenseRow = () => {
    setExpenseItems([...expenseItems, { serviceName: '', amount: '' }])
  }

  const removeExpenseRow = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index))
  }

  const updateExpense = (
    index: number,
    field: 'serviceName' | 'amount',
    value: string
  ) => {
    const updated = [...expenseItems]
    updated[index][field] = value
    setExpenseItems(updated)
  }

  const handleSubmit = async () => {
    if (!productId || !month || !year || !revenue) return
    setSaving(true)
    const validExpenses = expenseItems.filter(
      (e) => e.serviceName.trim() && e.amount
    )
    await createMonthlyRecord(
      Number(productId),
      Number(month),
      Number(year),
      revenue,
      validExpenses
    )
    setSaving(false)
    setOpen(false)
    setProductId('')
    setMonth('')
    setYear(String(currentYear))
    setRevenue('')
    setExpenseItems([{ serviceName: '', amount: '' }])
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <HugeiconsIcon icon={Add01Icon} className="size-4 mr-2" />
            Add Entry
          </Button>
        }
      />
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center size-10 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <HugeiconsIcon icon={File01Icon} className="size-5 text-violet-400" />
            </div>
            <DialogTitle>Add Monthly Entry</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={(v) => setProductId(v ?? '')}>
              <SelectTrigger>
                {productId
                  ? products.find((p) => String(p.id) === productId)?.name
                  : 'Select product'}
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={(v) => setMonth(v ?? '')}>
                <SelectTrigger>
                  {month ? months[Number(month) - 1] : 'Month'}
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={(v) => setYear(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue">Total Revenue ($)</Label>
            <Input
              id="revenue"
              type="number"
              step="0.01"
              min="0"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Cost Items</Label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={addExpenseRow}
                className="text-xs"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-3 mr-1" />
                Add Cost
              </Button>
            </div>

            {expenseItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input
                  placeholder="Service name"
                  value={item.serviceName}
                  onChange={(e) =>
                    updateExpense(i, 'serviceName', e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={item.amount}
                  onChange={(e) =>
                    updateExpense(i, 'amount', e.target.value)
                  }
                  className="w-28"
                />
                {expenseItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeExpenseRow(i)}
                    className="shrink-0 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !productId || !month || !revenue}
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
