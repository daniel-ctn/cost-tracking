'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete02Icon,
  File01Icon,
  Copy01Icon,
  RepeatIcon,
} from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  createMonthlyRecord,
  updateMonthlyRecord,
  getPreviousEntryExpenses,
  getTemplatesForProduct,
  type MonthlyRecord,
} from '@/app/actions'
import { formatMoney, type Currency } from '@/lib/currency'
import { cn } from '@/lib/utils'

type Product = { id: number; name: string }
export type ServiceOption = {
  id: number
  name: string
  defaultAmount: string | null
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i)

type ExpenseRow = { serviceName: string; amount: string; serviceId: number | null }

export function EntryDialog({
  products,
  services,
  record,
  currency,
  open,
  onOpenChange,
}: {
  products: Product[]
  services: ServiceOption[]
  record?: MonthlyRecord
  currency: Currency
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <HugeiconsIcon icon={File01Icon} className="size-5 text-primary" />
            </div>
            <DialogTitle>{record ? 'Edit entry' : 'Add monthly entry'}</DialogTitle>
          </div>
        </DialogHeader>
        {open && (
          <EntryForm
            key={record?.id ?? 'new'}
            products={products}
            services={services}
            record={record}
            currency={currency}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EntryForm({
  products,
  services,
  record,
  currency,
  onOpenChange,
}: {
  products: Product[]
  services: ServiceOption[]
  record?: MonthlyRecord
  currency: Currency
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [productId, setProductId] = useState(
    record ? String(record.productId) : ''
  )
  const [month, setMonth] = useState(record ? String(record.month) : '')
  const [year, setYear] = useState(
    record ? String(record.year) : String(currentYear)
  )
  const [revenue, setRevenue] = useState(record ? record.totalRevenue : '')
  const [note, setNote] = useState(record?.note ?? '')
  const [expenseItems, setExpenseItems] = useState<ExpenseRow[]>(
    record && record.expenses.length > 0
      ? record.expenses.map((e) => ({
          serviceName: e.serviceName,
          amount: e.amount,
          serviceId: e.serviceId,
        }))
      : [{ serviceName: '', amount: '', serviceId: null }]
  )
  const [errors, setErrors] = useState<{
    product?: string
    month?: string
    year?: string
    revenue?: string
    expenses: (string | null)[]
  }>({ expenses: [] })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [prefilling, setPrefilling] = useState<null | 'copy' | 'template'>(null)

  const fmt = (v: number) => formatMoney(v, currency)

  const addRow = () =>
    setExpenseItems([...expenseItems, { serviceName: '', amount: '', serviceId: null }])
  const removeRow = (i: number) =>
    setExpenseItems(expenseItems.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'serviceName' | 'amount', value: string) => {
    const next = [...expenseItems]
    // Editing the name detaches a row from its catalog service.
    next[i] = {
      ...next[i],
      [field]: value,
      ...(field === 'serviceName' ? { serviceId: null } : {}),
    }
    setExpenseItems(next)
  }

  const replaceRows = (rows: ExpenseRow[]) =>
    setExpenseItems(rows.length > 0 ? rows : [{ serviceName: '', amount: '', serviceId: null }])

  const addFromService = (sid: string | null) => {
    const svc = services.find((s) => String(s.id) === sid)
    if (!svc) return
    const row: ExpenseRow = {
      serviceName: svc.name,
      amount: svc.defaultAmount ?? '',
      serviceId: svc.id,
    }
    // Replace a leading empty row, otherwise append.
    const onlyEmpty =
      expenseItems.length === 1 &&
      !expenseItems[0].serviceName &&
      !expenseItems[0].amount
    setExpenseItems(onlyEmpty ? [row] : [...expenseItems, row])
  }

  const copyLastMonth = async () => {
    if (!productId || !month || !year) return
    setPrefilling('copy')
    const rows = await getPreviousEntryExpenses(
      Number(productId),
      Number(year),
      Number(month)
    )
    setPrefilling(null)
    if (rows.length === 0) {
      setSubmitError('No earlier entry found for this product.')
      return
    }
    setSubmitError(null)
    replaceRows(rows)
  }

  const useTemplates = async () => {
    if (!productId) return
    setPrefilling('template')
    const rows = await getTemplatesForProduct(Number(productId))
    setPrefilling(null)
    if (rows.length === 0) {
      setSubmitError('No active templates for this product.')
      return
    }
    setSubmitError(null)
    replaceRows(rows)
  }

  const totalCost = expenseItems.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  )
  const profit = (Number(revenue) || 0) - totalCost
  const margin = Number(revenue) > 0 ? (profit / Number(revenue)) * 100 : null

  const validate = () => {
    const next: typeof errors = { expenses: [] }
    if (!productId) next.product = 'Select a product'
    if (!month) next.month = 'Required'
    if (!year) next.year = 'Required'
    const rev = Number(revenue)
    if (revenue.trim() === '') next.revenue = 'Required'
    else if (!Number.isFinite(rev) || rev < 0) next.revenue = 'Enter a valid amount'

    next.expenses = expenseItems.map((it) => {
      const hasName = it.serviceName.trim() !== ''
      const hasAmount = it.amount.trim() !== ''
      if (!hasName && !hasAmount) return null
      if (!hasName) return 'Name required'
      const a = Number(it.amount)
      if (!hasAmount || !Number.isFinite(a) || a < 0) return 'Invalid amount'
      return null
    })

    setErrors(next)
    return (
      !next.product &&
      !next.month &&
      !next.year &&
      !next.revenue &&
      next.expenses.every((e) => !e)
    )
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!validate()) return
    setSaving(true)
    const items = expenseItems
      .filter((it) => it.serviceName.trim() && it.amount.trim())
      .map((it) => ({
        serviceName: it.serviceName.trim(),
        amount: it.amount,
        serviceId: it.serviceId,
      }))

    const payload = {
      productId: Number(productId),
      month: Number(month),
      year: Number(year),
      totalRevenue: revenue,
      note: note.trim() || null,
      expenseItems: items,
    }
    const res = record
      ? await updateMonthlyRecord(record.id, payload)
      : await createMonthlyRecord(payload)
    setSaving(false)
    if (!res.ok) {
      setSubmitError(res.error)
      return
    }
    onOpenChange(false)
    router.refresh()
  }

  return (
    <div className="space-y-5 pt-1">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? '')}>
          <SelectTrigger className="w-full" aria-invalid={!!errors.product}>
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
        {errors.product && <FieldError>{errors.product}</FieldError>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={month} onValueChange={(v) => setMonth(v ?? '')}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.month}>
              {month ? MONTHS[Number(month) - 1] : 'Month'}
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.month && <FieldError>{errors.month}</FieldError>}
        </div>
        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={year} onValueChange={(v) => setYear(v ?? '')}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.year}>
              {year || 'Year'}
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.year && <FieldError>{errors.year}</FieldError>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="revenue">Total revenue</Label>
        <Input
          id="revenue"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          placeholder="0.00"
          aria-invalid={!!errors.revenue}
        />
        {errors.revenue && <FieldError>{errors.revenue}</FieldError>}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Cost items</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={copyLastMonth}
              disabled={!productId || !month || !year || prefilling !== null}
            >
              <HugeiconsIcon icon={Copy01Icon} className="mr-1 size-3" />
              {prefilling === 'copy' ? 'Copying…' : 'Last month'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={useTemplates}
              disabled={!productId || prefilling !== null}
            >
              <HugeiconsIcon icon={RepeatIcon} className="mr-1 size-3" />
              {prefilling === 'template' ? 'Loading…' : 'Templates'}
            </Button>
            <Button type="button" variant="outline" size="xs" onClick={addRow}>
              <HugeiconsIcon icon={Add01Icon} className="mr-1 size-3" />
              Add
            </Button>
          </div>
        </div>

        {services.length > 0 && (
          <Select value="" onValueChange={addFromService}>
            <SelectTrigger className="w-full">
              <span className="text-muted-foreground">＋ Add from service catalog</span>
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                  {s.defaultAmount ? ` · ${fmt(Number(s.defaultAmount))}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {expenseItems.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-start gap-2">
              <Input
                placeholder="Service name"
                value={item.serviceName}
                onChange={(e) => updateRow(i, 'serviceName', e.target.value)}
                className="flex-1"
                aria-invalid={!!errors.expenses[i]}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0.00"
                value={item.amount}
                onChange={(e) => updateRow(i, 'amount', e.target.value)}
                className="w-28"
                aria-invalid={!!errors.expenses[i]}
              />
              {expenseItems.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove cost item"
                  onClick={() => removeRow(i)}
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                </Button>
              )}
            </div>
            {errors.expenses[i] && <FieldError>{errors.expenses[i]}</FieldError>}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain a spike or one-off change…"
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-sm">
        <span className="text-muted-foreground">Projected profit</span>
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-semibold tabular-nums',
              profit >= 0 ? 'text-foreground' : 'text-destructive'
            )}
          >
            {fmt(profit)}
          </span>
          {margin !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {margin.toFixed(1)}% margin
            </span>
          )}
        </span>
      </div>

      {submitError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : record ? 'Save changes' : 'Save entry'}
        </Button>
      </div>
    </div>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-destructive">{children}</p>
}
