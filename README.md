# Cost & Profit Tracker

A lightweight internal web app to manually track monthly maintenance costs and revenues across products, and visualize month-over-month profit margins.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Neon (Serverless Postgres)
- **ORM:** Drizzle ORM
- **UI:** shadcn/ui
- **Charts:** Recharts
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Neon](https://neon.tech) database

### Setup

```bash
pnpm install
```

Copy `.env.local` and fill in your Neon connection string:

```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

Push the database schema:

```bash
pnpm db:push
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Dashboard** — Summary cards for current month revenue, costs, and profit, plus a bar chart comparing month-over-month performance.
- **Products** — Add, edit, and delete the products you track.
- **Monthly Entries** — Record revenue and multiple cost items per product per month. Profit is calculated automatically.

## Database Commands

| Command | Description |
|---|---|
| `pnpm db:push` | Push schema directly to database |
| `pnpm db:generate` | Generate SQL migration files |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
  app/
    layout.tsx              Root layout with navigation
    page.tsx                Dashboard page
    actions.ts              Server actions (CRUD)
    products/page.tsx       Product management
    entries/page.tsx        Monthly entry list
  components/
    dashboard-chart.tsx     Recharts bar chart
    add-entry-dialog.tsx    Entry form with dynamic cost items
    add-product-dialog.tsx  Product creation dialog
    products-table.tsx      Product list with edit/delete
    entries-list.tsx        Entry list
    ui/                     shadcn/ui components
  db/
    schema.ts               Drizzle schema definitions
  lib/
    db.ts                   Database connection
    utils.ts                 Utility functions
```
