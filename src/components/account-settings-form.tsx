'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { updateUserSettings } from '@/app/actions'
import { CURRENCIES, CURRENCY_LABELS, type Currency } from '@/lib/currency'

export function AccountSettingsForm({
  currency: initialCurrency,
  monthlyBudget: initialBudget,
}: {
  currency: Currency
  monthlyBudget: string | null
}) {
  const router = useRouter()
  const [currency, setCurrency] = useState<Currency>(initialCurrency)
  const [budget, setBudget] = useState(initialBudget ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const res = await updateUserSettings(currency, budget.trim() || undefined)
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Display currency and an optional total monthly budget. Amounts are
          entered and shown in this currency — no conversion is applied.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency((v as Currency) ?? 'USD')}
          >
            <SelectTrigger className="w-full">
              {CURRENCY_LABELS[currency]}
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="global-budget">Total monthly budget (optional)</Label>
          <Input
            id="global-budget"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 500.00"
          />
          <p className="text-xs text-muted-foreground">
            Dashboard warns when total monthly cost exceeds this.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            Preferences saved.
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save preferences'}
        </Button>
      </form>
    </div>
  )
}
