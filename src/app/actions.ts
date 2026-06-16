"use server"

import { db } from "@/lib/db"
import { products, monthlyRecords, expenses } from "@/db/schema"
import { and, eq, sql, desc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/auth-helpers"

async function ownedProductIds(userId: string): Promise<number[]> {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.userId, userId))
  return rows.map((r) => r.id)
}

export async function getProducts() {
  const userId = await requireUserId()
  return db
    .select()
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(products.name)
}

export async function createProduct(name: string, description: string) {
  const userId = await requireUserId()
  const [product] = await db
    .insert(products)
    .values({ userId, name, description: description || null })
    .returning()
  revalidatePath("/products")
  return product
}

export async function updateProduct(
  id: number,
  name: string,
  description: string
) {
  const userId = await requireUserId()
  const [product] = await db
    .update(products)
    .set({ name, description: description || null })
    .where(and(eq(products.id, id), eq(products.userId, userId)))
    .returning()
  revalidatePath("/products")
  return product
}

export async function deleteProduct(id: number) {
  const userId = await requireUserId()
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.userId, userId)))
  revalidatePath("/products")
}

export type ExpenseInput = {
  serviceName: string
  amount: string
}

export type ActionResult = { ok: true } | { ok: false; error: string }

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

export async function createMonthlyRecord(
  productId: number,
  month: number,
  year: number,
  totalRevenue: string,
  expenseItems: ExpenseInput[]
): Promise<ActionResult> {
  const userId = await requireUserId()
  const [owned] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.userId, userId)))
  if (!owned) return { ok: false, error: "Product not found." }

  let recordId: number
  try {
    const [record] = await db
      .insert(monthlyRecords)
      .values({ productId, month, year, totalRevenue })
      .returning({ id: monthlyRecords.id })
    recordId = record.id
  } catch (e) {
    if (isDuplicatePeriodError(e)) return { ok: false, error: DUPLICATE_PERIOD_MSG }
    throw e
  }

  if (expenseItems.length > 0) {
    await db.insert(expenses).values(
      expenseItems.map((e) => ({
        recordId,
        serviceName: e.serviceName,
        amount: e.amount,
      }))
    )
  }

  revalidatePath("/entries")
  revalidatePath("/")
  return { ok: true }
}

export async function updateMonthlyRecord(
  id: number,
  productId: number,
  month: number,
  year: number,
  totalRevenue: string,
  expenseItems: ExpenseInput[]
): Promise<ActionResult> {
  const userId = await requireUserId()
  const owned = await ownedProductIds(userId)
  if (!owned.includes(productId)) return { ok: false, error: "Product not found." }

  let updated: { id: number }[]
  try {
    updated = await db
      .update(monthlyRecords)
      .set({ productId, month, year, totalRevenue })
      .where(
        and(eq(monthlyRecords.id, id), inArray(monthlyRecords.productId, owned))
      )
      .returning({ id: monthlyRecords.id })
  } catch (e) {
    if (isDuplicatePeriodError(e)) return { ok: false, error: DUPLICATE_PERIOD_MSG }
    throw e
  }
  if (updated.length === 0) return { ok: false, error: "Entry not found." }

  await db.delete(expenses).where(eq(expenses.recordId, id))
  if (expenseItems.length > 0) {
    await db.insert(expenses).values(
      expenseItems.map((e) => ({
        recordId: id,
        serviceName: e.serviceName,
        amount: e.amount,
      }))
    )
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
}

export type MonthlyRecord = {
  id: number
  productId: number
  productName: string | null
  month: number
  year: number
  totalRevenue: string
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
      productName: products.name,
    })
    .from(monthlyRecords)
    .innerJoin(products, eq(monthlyRecords.productId, products.id))
    .where(eq(products.userId, userId))
    .orderBy(desc(monthlyRecords.year), desc(monthlyRecords.month), desc(monthlyRecords.id))

  if (records.length === 0) return []

  const rows = await db
    .select()
    .from(expenses)
    .where(inArray(expenses.recordId, records.map((r) => r.id)))

  const byRecord = new Map<number, RecordExpense[]>()
  for (const e of rows) {
    const list = byRecord.get(e.recordId) ?? []
    list.push({ id: e.id, serviceName: e.serviceName, amount: e.amount })
    byRecord.set(e.recordId, list)
  }

  return records.map((r) => ({ ...r, expenses: byRecord.get(r.id) ?? [] }))
}

export async function deleteMonthlyRecord(id: number) {
  const userId = await requireUserId()
  const owned = await ownedProductIds(userId)
  await db
    .delete(monthlyRecords)
    .where(and(eq(monthlyRecords.id, id), inArray(monthlyRecords.productId, owned)))
  revalidatePath("/entries")
  revalidatePath("/")
}
