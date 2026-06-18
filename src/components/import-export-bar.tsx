'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Download01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  exportCsv,
  importEntries,
  type ExportEntity,
  type ImportRow,
  type ImportResult,
} from '@/app/actions'

const EXPORTS: { id: ExportEntity; label: string }[] = [
  { id: 'entries', label: 'Entries' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'products', label: 'Products' },
  { id: 'services', label: 'Services' },
  { id: 'templates', label: 'Templates' },
]

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      cur.push(field)
      field = ''
    } else if (c === '\n') {
      cur.push(field)
      rows.push(cur)
      cur = []
      field = ''
    } else if (c !== '\r') field += c
  }
  if (field !== '' || cur.length > 0) {
    cur.push(field)
    rows.push(cur)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function rowsToImport(text: string): ImportRow[] {
  const grid = parseCsv(text)
  if (grid.length < 2) return []
  const header = grid[0].map((h) => h.trim().toLowerCase())
  const col = (...names: string[]) =>
    header.findIndex((h) => names.includes(h))
  const ip = col('product', 'productname')
  const iy = col('year')
  const im = col('month')
  const isn = col('servicename', 'service')
  const ia = col('amount')
  const ir = col('revenue', 'totalrevenue')
  return grid.slice(1).map((r) => ({
    product: ip >= 0 ? (r[ip] ?? '').trim() : '',
    year: iy >= 0 ? (r[iy] ?? '').trim() : '',
    month: im >= 0 ? (r[im] ?? '').trim() : '',
    serviceName: isn >= 0 ? (r[isn] ?? '').trim() : '',
    amount: ia >= 0 ? (r[ia] ?? '').trim() : '',
    revenue: ir >= 0 ? (r[ir] ?? '').trim() : '',
  }))
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportExportBar() {
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  const [open, setOpen] = useState(false)

  const onExport = async (entity: ExportEntity) => {
    const csv = await exportCsv(entity)
    download(`costtracker-${entity}.csv`, csv)
  }

  return (
    <>
      <Select value="" onValueChange={(v) => onExport(v as ExportEntity)}>
        <SelectTrigger aria-label="Export CSV">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Download01Icon} className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {EXPORTS.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={Upload01Icon} className="size-4 sm:mr-2" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      <ImportDialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !importing) setOpen(false)
        }}
        importing={importing}
        setImporting={setImporting}
        onDone={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}

function ImportDialog({
  open,
  onOpenChange,
  importing,
  setImporting,
  onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  importing: boolean
  setImporting: (v: boolean) => void
  onDone: () => void
}) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<ImportResult | null>(null)

  const reset = () => {
    setText('')
    setPreview(null)
  }

  const onPreview = async () => {
    const rows = rowsToImport(text)
    const res = await importEntries(rows, false)
    setPreview(res)
  }

  const onCommit = async () => {
    const rows = rowsToImport(text)
    setImporting(true)
    const res = await importEntries(rows, true)
    setImporting(false)
    if (res.ok) {
      reset()
      onDone()
    } else {
      setPreview(res)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import entries</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            Paste CSV with headers{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              product,year,month,serviceName,amount,revenue
            </code>
            . Each row is one cost line; rows are grouped into entries by product
            and period. Existing periods are replaced. Products must already exist.
          </p>
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setPreview(null)
            }}
            rows={6}
            placeholder={'product,year,month,serviceName,amount,revenue\nMy App,2026,5,Neon,19.00,1200.00'}
            className="font-mono text-xs"
          />

          {preview && (
            <div className="space-y-2">
              {preview.errors.length > 0 && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <p className="font-medium">{preview.errors.length} error(s):</p>
                  <ul className="mt-1 list-inside list-disc">
                    {preview.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {preview.groups.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-left">Period</th>
                        <th className="px-3 py-2 text-right">Costs</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.groups.slice(0, 50).map((g, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5">{g.product}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {MONTHS[g.month - 1]} {g.year}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {g.expenseCount}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <span
                              className={
                                g.status === 'update'
                                  ? 'text-primary'
                                  : 'text-success'
                              }
                            >
                              {g.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {preview && preview.ok && preview.groups.length > 0 ? (
              <Button onClick={onCommit} disabled={importing}>
                {importing
                  ? 'Importing…'
                  : `Import ${preview.groups.length} entr${preview.groups.length === 1 ? 'y' : 'ies'}`}
              </Button>
            ) : (
              <Button onClick={onPreview} disabled={!text.trim()}>
                Preview
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
