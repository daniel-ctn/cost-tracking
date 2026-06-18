import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth-helpers'
import { getUserSettings } from '@/app/actions'
import { ChangePasswordForm } from '@/components/change-password-form'
import { AccountSettingsForm } from '@/components/account-settings-form'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserCircleIcon } from '@hugeicons/core-free-icons'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const settings = await getUserSettings()

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Account</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={UserCircleIcon} className="size-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.email}</p>
            <p className="text-sm text-muted-foreground">Signed in to CostTracker</p>
          </div>
        </div>
      </div>

      <AccountSettingsForm
        currency={settings.currency}
        monthlyBudget={settings.monthlyBudget}
      />

      <ChangePasswordForm />
    </div>
  )
}
