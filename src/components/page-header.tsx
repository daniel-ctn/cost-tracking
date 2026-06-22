import { cn } from '@/lib/utils'

/**
 * The page-level counterpart to SectionHeading — same accent-tick signature, at
 * title scale — so every screen opens with the product's voice instead of a
 * bare generic title. Optional description carries the screen's purpose;
 * optional action holds the primary CTA.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span className="h-11 w-1 shrink-0 rounded-full bg-primary" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
