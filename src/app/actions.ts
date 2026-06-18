"use server"

import { db } from "@/lib/db"
import {
  products,
  monthlyRecords,
  expenses,
  services,
} from "@/db/schema"
import { and, eq, sql, desc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/auth-helpers"
import {
  parse,
  productSchema,
  monthlyRecordSchema,
} from "@/lib/validation"

async function ownedProductIds(userId: string): Promise<number[]> {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.userId, userId))
  return rows.map((r) => r.id)
}

/** Returns the subset of the given service ids that belong to the user. */
async function ownedServiceIds(
  userId: string,
  ids: number[]
): Promise<Set<number>> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return new Set()
  const rows = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.userId, userId), inArray(services.id, unique)))
  return new Set(rows.map((r) => r.id))
}

export async function getProducts() {
  const userId = await requireUserId()
  return db
    .select()
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(products.name)
}

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createProduct(
  name: string,
  description: string,
  monthlyBudget?: string
): Promise<ActionResult> {
  const userId = await requireUserId()
  const parsed = parse(productSchema, { name, description, monthlyBudget })
  if (!parsed.ok) return { ok: false, error: parsed.error }

  await db.insert(products).values({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
    monthlyBudget: parsed.data.monthlyBudget,
  })
  revalidatePath("/products")
  return { ok: true }
}

export async function updateProduct(
  id: number,
  name: string,
  description: string,
  monthlyBudget?: string
): Promise<ActionResult> {
  const userId = await requireUserId()
  const parsed = parse(productSchema, { name, description, monthlyBudget })
  if (!parsed.ok) return { ok: false, error: parsed.error }

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      monthlyBudget: parsed.data.monthlyBudget,
    })
    .where(and(eq(products.id, id), eq(products.userId, userId)))
  revalidatePath("/products")
  revalidatePath("/")
  return { ok: true }
}

export async function deleteProduct(id: number) {
  const userId = await requireUserId()
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.userId, userId)))
  revalidatePath("/products")
  revalidatePath("/")
}

export type ExpenseInput = {
  serviceName: string
  amount: string
  serviceId?: number | null
}

export type MonthlyRecordInput = {
  productId: number
  month: number
  year: number
  totalRevenue: string
  note?: string | null
  expenseItems: ExpenseInput[]
}

const DUPLICATE_PERIOD_MSG =
  "An entry for this product and period already exists. Edit the existing entry instead."

function isDuplicatePeriodError(e: unknown): boolean {
  // Drizzle wraps DB errors in DrizzleQueryError, so the Postgres code
  // (23505) and constraint name live on the `cause` chain, not the top error.
  let cur = e as { code?: string; message?: string; cause?: unknown } | undefined
  for (let i = 0; i < 4 && cur; i++) {
    if (cur.code === "23505") return true
    if (
      typeof cur.message === "string" &&
      (cur.message.includes("monthly_records_product_period_unique") ||
        cur.message.toLowerCase().includes("duplicate key"))
    ) {
      return true
    }
    cur = cur.cause as typeof cur
  }
  return false
}

/** Validate input + verify product/service ownership for a record write. */
async function prepareRecordWrite(userId: string, input: MonthlyRecordInput) {
  const parsed = parse(monthlyRecordSchema, input)
  if (!parsed.ok) return { ok: false as const, error: parsed.error }

  const owned = await ownedProductIds(userId)
  if (!owned.includes(parsed.data.productId)) {
    return { ok: false as const, error: "Product not found." }
  }

  const serviceIds = parsed.data.expenseItems
    .map((e) => e.serviceId)
    .filter((id): id is number => typeof id === "number")
  const validServices = await ownedServiceIds(userId, serviceIds)
  const items = parsed.data.expenseItems.map((e) => ({
    serviceName: e.serviceName,
    amount: e.amount,
    // Drop links to services the user doesn't own; keep the free-text name.
    serviceId: e.serviceId && validServices.has(e.serviceId) ? e.serviceId : null,
  }))

  return { ok: true as const, data: parsed.data, owned, items }
}

export async function createMonthlyRecord(
  input: MonthlyRecordInput
): Promise<ActionResult> {
  const userId = await requireUserId()
  const prep = await prepareRecordWrite(userId, input)
  if (!prep.ok) return { ok: false, error: prep.error }
  const { data, items } = prep
  const { productId, month, year, totalRevenue, note } = data

  try {
    if (items.length === 0) {
      await db.insert(monthlyRecords).values({
        productId,
        month,
        year,
        totalRevenue,
        note,
      })
    } else {
      // Single CTE statement = atomic: the record and its expenses commit or
      // roll back together (neon-http has no interactive transactions).
      const values = items.map(
        (e) =>
          sql`(${e.serviceName}::text, ${e.amount}::numeric, ${e.serviceId}::integer)`
      )
      await db.execute(sql`
        WITH r AS (
          INSERT INTO monthly_records (product_id, month, year, total_revenue, note)
          VALUES (${productId}, ${month}, ${year}, ${totalRevenue}::numeric, ${note})
          RETURNING id
        )
        INSERT INTO expenses (record_id, service_name, amount, service_id)
        SELECT r.id, v.service_name, v.amount, v.service_id
        FROM r, (VALUES ${sql.join(values, sql`, `)})
          AS v(service_name, amount, service_id)
      `)
    }
  } catch (e) {
    if (isDuplicatePeriodError(e)) return { ok: false, error: DUPLICATE_PERIOD_MSG }
    throw e
  }

  revalidatePath("/entries")
  revalidatePath("/")
  return { ok: true }
}

export async function updateMonthlyRecord(
  id: number,
  input: MonthlyRecordInput
): Promise<ActionResult> {
  const userId = await requireUserId()
  const prep = await prepareRecordWrite(userId, input)
  if (!prep.ok) return { ok: false, error: prep.error }
  const { data, owned, items } = prep
  const { productId, month, year, totalRevenue, note } = data

  // Authorize the target record before mutating, so a forged id can't delete
  // another user's expenses via the recordId-scoped delete below.
  const [rec] = await db
    .select({ id: monthlyRecords.id })
    .from(monthlyRecords)
    .innerJoin(products, eq(monthlyRecords.productId, products.id))
    .where(and(eq(monthlyRecords.id, id), eq(products.userId, userId)))
  if (!rec) return { ok: false, error: "Entry not found." }

  const updateQ = db
    .update(monthlyRecords)
    .set({ productId, month, year, totalRevenue, note })
    .where(
      and(eq(monthlyRecords.id, id), inArray(monthlyRecords.productId, owned))
    )
  const deleteQ = db.delete(expenses).where(eq(expenses.recordId, id))

  try {
    if (items.length > 0) {
      const insertQ = db.insert(expenses).values(
        items.map((e) => ({
          recordId: id,
          serviceName: e.serviceName,
          amount: e.amount,
          serviceId: e.serviceId,
        }))
      )
      await db.batch([updateQ, deleteQ, insertQ])
    } else {
      await db.batch([updateQ, deleteQ])
    }
  } catch (e) {
    if (isDuplicatePeriodError(e)) return { ok: false, error: DUPLICATE_PERIOD_MSG }
    throw e
  }

  revalidatePath("/entries")
  revalidatePath("/")
  return { ok: true }
}

export type DashboardRow = {
  productId: number
  productName: string | null
  month: number
  year: number
  revenue: number
  cost: number
}

export async function getDashboardData(): Promise<DashboardRow[]> {
  const userId = await requireUserId()
  const records = await db
    .select({
      id: monthlyRecords.id,
      productId: monthlyRecords.productId,
      month: monthlyRecords.month,
      year: monthlyRecords.year,
      totalRevenue: monthlyRecords.totalRevenue,
      productName: products.name,
      cost: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`.as("total_cost"),
    })
    .from(monthlyRecords)
    .innerJoin(products, eq(monthlyRecords.productId, products.id))
    .leftJoin(expenses, eq(monthlyRecords.id, expenses.recordId))
    .where(eq(products.userId, userId))
    .groupBy(monthlyRecords.id, products.name)
    .orderBy(monthlyRecords.year, monthlyRecords.month)

  return records.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    month: r.month,
    year: r.year,
    revenue: Number(r.totalRevenue),
    cost: Number(r.cost),
  }))
}

export type RecordExpense = {
  id: number
  serviceName: string
  amount: string
  serviceId: number | null
}

export type MonthlyRecord = {
  id: number
  productId: number
  productName: string | null
  month: number
  year: number
  totalRevenue: string
  note: string | null
  expenses: RecordExpense[]
}

export async function getMonthlyRecords(): Promise<MonthlyRecord[]> {
  const userId = await requireUserId()
  const records = await db
    .select({
      id: monthlyRecords.id,
      productId: monthlyRecords.productId,
      month: monthlyRecords.month,
      year: monthlyRecords.year,
      totalRevenue: monthlyRecords.totalRevenue,
      note: monthlyRecords.note,
      productName: products.name,
    })
    .from(monthlyRecords)
    .innerJoin(products, eq(monthlyRecords.productId, products.id))
    .where(eq(products.userId, userId))
    .orderBy(
      desc(monthlyRecords.year),
      desc(monthlyRecords.month),
      desc(monthlyRecords.id)
    )

  if (records.length === 0) return []

  const rows = await db
    .select()
    .from(expenses)
    .where(
      inArray(
        expenses.recordId,
        records.map((r) => r.id)
      )
    )

  const byRecord = new Map<number, RecordExpense[]>()
  for (const e of rows) {
    const list = byRecord.get(e.recordId) ?? []
    list.push({
      id: e.id,
      serviceName: e.serviceName,
      amount: e.amount,
      serviceId: e.serviceId,
    })
    byRecord.set(e.recordId, list)
  }

  return records.map((r) => ({ ...r, expenses: byRecord.get(r.id) ?? [] }))
}

export async function deleteMonthlyRecord(id: number) {
  const userId = await requireUserId()
  const owned = await ownedProductIds(userId)
  if (owned.length === 0) return
  await db
    .delete(monthlyRecords)
    .where(and(eq(monthlyRecords.id, id), inArray(monthlyRecords.productId, owned)))
  revalidatePath("/entries")
  revalidatePath("/")
}
