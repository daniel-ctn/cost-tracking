# Design System

**Status:** current

How the Cost & Profit Tracker UI is built. Read this before any UI, page, or
styling change so new work stays consistent.

## Principles

- **Tokens over custom colors.** Use the semantic tokens below (`bg-card`,
  `text-muted-foreground`, `text-primary`, …). Do not hardcode palette colors
  like `violet-400` or `white/[0.04]` — they break the light/dark themes.
- **No gradient backgrounds.** Surfaces are solid `bg-card` / `bg-background`
  with `border-border` for separation. (Gradients are only used for chart bar
  fills, never page or card backgrounds.)
- **Theme-safe by construction.** Anything rendered must look correct in both
  light and dark. Chart colors use the raw CSS vars (`var(--chart-1)` …) so
  Recharts SVG adapts to the active theme.

## Theming

- `next-themes` drives the theme via a `class` on `<html>` (`.dark`), with
  `defaultTheme="system"`. Provider: `components/theme-provider.tsx`; toggle:
  `components/theme-toggle.tsx` (swaps sun/moon with the `dark:` variant — no
  mount effect, no hydration flash).
- Tokens are defined in `src/app/globals.css`: `:root` (light) and `.dark`
  (dark), then mapped to Tailwind utilities in the `@theme inline` block.

## Color tokens

| Token | Use |
|---|---|
| `background` / `foreground` | Page surface and primary text |
| `card` / `card-foreground` | Panels, tables, KPI cards |
| `muted` / `muted-foreground` | Subtle fills, secondary text |
| `accent` / `accent-foreground` | Hover/active nav, subtle highlights |
| `primary` / `primary-foreground` | Brand (violet) — profit, primary CTAs |
| `success` / `success-foreground` | Revenue, positive deltas |
| `destructive` / `destructive-foreground` | Costs, negative deltas, delete |
| `border` / `input` / `ring` | Borders, inputs, focus rings |
| `chart-1..5` | Chart series: 1 profit (violet), 2 cost (red), 3 revenue (teal), 4–5 extra |

**Semantics:** profit/brand → `primary`, revenue/positive → `success` (or
`chart-3`), cost/negative/destructive → `destructive` (or `chart-2`). Rising
costs are "bad" and read as destructive in deltas.

## Typography

- Sans: **DM Sans** (`--font-dm-sans`, default `font-sans`).
- Mono: **JetBrains Mono** (`--font-jetbrains-mono`) for chart axes.
- Use `tabular-nums` for all currency/number columns so figures align.

## Layout patterns

- **Page rhythm:** top-level page `div` uses `space-y-8`.
- **Accent-tick signature:** a thin vertical `bg-primary` tick (echoing the
  ascending-bars logo) marks both page titles and in-card section titles, so
  screens read as one family. Always use the components below rather than
  hand-rolling the eyebrow/title markup.
- **Page header:** `<PageHeader eyebrow title description? action? />`
  (`page-header.tsx`) — accent tick + uppercase eyebrow + `text-3xl` title, an
  optional one-line purpose description, and an optional right-aligned CTA.
- **Section header:** `<SectionHeading eyebrow? title meta? accent? />`
  (`section-heading.tsx`) — the in-card counterpart. `accent` is state-aware
  (`destructive` when a panel has warnings, `muted` for secondary panels).
- **Card / panel:** `rounded-2xl border border-border bg-card p-6` (tables use
  `overflow-hidden` and no padding). The dashboard hero is a larger
  `rounded-3xl` panel.
- **Content width:** `max-w-6xl mx-auto` (set in the layout).

## Navigation & app shell

- **Top command bar, not a sidebar.** With six sections this is a personal-tool
  bar; a sidebar would be overkill. The header (`(app)/layout.tsx`) is sticky +
  `backdrop-blur`, holds logo, `main-nav`, a contextual currency chip linking to
  settings, theme toggle, and the user menu.
- **Active nav** uses a brand-tinted pill (`bg-primary/10 text-primary`), and a
  hairline divider separates Dashboard (the read view) from the management
  group. Spacing tightens on mobile so the bar never overflows.

## Dashboard

- Opens with a **cockpit hero** (`dashboard-hero.tsx`): headline net profit +
  profit sparkline, a bespoke SVG **margin-health gauge** (Healthy / Thin /
  Loss), and revenue/costs as supporting stats — not four identical KPI cards.
- Modules are purpose-shaped: a "Needs attention" signal stream, a ranked
  profit **leaderboard**, and cost **composition** breakdowns (share %).

## Shared components

- `page-header.tsx` / `section-heading.tsx` — the accent-tick title signatures.
- `empty-state.tsx` — dashed-border empty state (icon, title, description, optional action).
- `confirm-dialog.tsx` — reusable destructive confirmation dialog.
- `main-nav.tsx` — header nav with `aria-current` active styling.

Icons come from `@hugeicons/core-free-icons` via `<HugeiconsIcon icon={...} />`.
