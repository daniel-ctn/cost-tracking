export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="CostTracker logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="7" fill="#724DE7" />
      <rect x="7.36" y="16.8" width="4.16" height="6.4" rx="1.6" fill="#fff" />
      <rect x="13.92" y="12.96" width="4.16" height="10.24" rx="1.6" fill="#fff" />
      <rect x="20.48" y="8.48" width="4.16" height="14.72" rx="1.6" fill="#fff" />
    </svg>
  )
}
