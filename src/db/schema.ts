import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core"

export * from "./auth-schema"
import { user } from "./auth-schema"

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    // Optional monthly cost budget for this product (alerts when exceeded).
    monthlyBudget: decimal("monthly_budget", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("products_user_idx").on(t.userId)]
)

/**
 * Provider/service catalog so costs can be tracked across products. Expense
 * rows optionally link to a service; the denormalized `serviceName` on each
 * expense is preserved for migration compatibility and free-text fallback.
 */
export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("Other"),
    billingUrl: text("billing_url"),
    defaultAmount: decimal("default_amount", { precision: 10, scale: 2 }),
    monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }),
    // Shared services are split across products via shared_costs allocations.
    isShared: boolean("is_shared").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("services_user_name_unique").on(t.userId, t.name),
    index("services_user_idx").on(t.userId),
  ]
)

export const monthlyRecords = pgTable(
  "monthly_records",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    totalRevenue: decimal("total_revenue", {
      precision: 12,
      scale: 2,
    }).notNull(),
    // Free-text note to explain spikes or one-off changes for the period.
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("monthly_records_product_period_unique").on(
      t.productId,
      t.month,
      t.year
    ),
    index("monthly_records_product_idx").on(t.productId),
    index("monthly_records_period_idx").on(t.year, t.month),
  ]
)

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    recordId: integer("record_id")
      .notNull()
      .references(() => monthlyRecords.id, { onDelete: "cascade" }),
    // Optional link to the service catalog; null keeps legacy free-text rows.
    serviceId: integer("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    serviceName: text("service_name").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [
    index("expenses_record_idx").on(t.recordId),
    index("expenses_service_idx").on(t.serviceId),
  ]
)

/** Per product/service recurring expected costs used to prefill new entries. */
export const costTemplates = pgTable(
  "cost_templates",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    serviceId: integer("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    label: text("label").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("cost_templates_user_idx").on(t.userId),
    index("cost_templates_product_idx").on(t.productId),
  ]
)

/** A shared service's total monthly cost, split across products. */
export const sharedCosts = pgTable(
  "shared_costs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    serviceId: integer("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    label: text("label").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    // 'equal' | 'percentage' | 'fixed'
    method: text("method").notNull().default("equal"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("shared_costs_user_idx").on(t.userId),
    index("shared_costs_period_idx").on(t.year, t.month),
  ]
)

export const sharedCostAllocations = pgTable(
  "shared_cost_allocations",
  {
    id: serial("id").primaryKey(),
    sharedCostId: integer("shared_cost_id")
      .notNull()
      .references(() => sharedCosts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // For 'percentage' this is a percent (0-100); for 'fixed' an amount;
    // ignored for 'equal'.
    weight: decimal("weight", { precision: 12, scale: 4 }),
  },
  (t) => [index("shared_alloc_cost_idx").on(t.sharedCostId)]
)

/** Per-account preferences (display currency, optional global budget). */
export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("USD"),
  monthlyBudget: decimal("monthly_budget", { precision: 12, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
