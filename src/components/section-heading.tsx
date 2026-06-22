import { cn } from '@/lib/utils'

type Accent = 'primary' | 'destructive' | 'success' | 'muted'

const ACCENT: Record<Accent, string> = {
  primary: 'bg-primary',
  destructive: 'bg-destructive',
  success: 'bg-success',
  muted: 'bg-muted-foreground/40',
}

/**
 * The product's consistent section signature: a vertical accent tick (echoing
 * the ascending-bars logo) + eyebrow + title, with optional right-aligned meta.
 * Used across dashboard modules so sections read as one family instead of a
 * stack of identical card headers.
 */
export function SectionHeading({
  eyebrow,
  title,
  meta,
  accent = 'primary',
  className,
}: {
  eyebrow?: string
  title: string
  meta?: React.ReactNode
  accent?: Accent
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex items-stretch gap-3">
        <span className={cn('w-1 shrink-0 rounded-full', ACCENT[accent])} />
        <div className="py-0.5">
          {eyebrow && (
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        </div>
      </div>
      {meta && <div className="shrink-0 text-sm text-muted-foreground">{meta}</div>}
    </div>
  )
}
