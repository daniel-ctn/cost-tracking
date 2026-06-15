'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Sun03Icon, Moon02Icon } from '@hugeicons/core-free-icons'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <HugeiconsIcon icon={Moon02Icon} className="size-4 dark:hidden" />
      <HugeiconsIcon icon={Sun03Icon} className="hidden size-4 dark:block" />
    </Button>
  )
}
