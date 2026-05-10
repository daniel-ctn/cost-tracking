"use server"

import { db } from "@/lib/db"
import { products, monthlyRecords, expenses } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getProducts() {
  return db.select().from(products).orderBy(products.name)
}

export async function createProduct(name: string, description: string) {
  const [product] = await db
    .insert(products)
    .values({ name, description: description || null })
    .returning()
  revalidatePath("/products")
  return product
}

export async function updateProduct(
  id: number,
  name: string,
  description: string
) {
  const [product] = await db
    .update(products)
    .set({ name, description: description || null })
    .where(eq(products.id, id))
    .returning()
  revalidatePath("/products")
  return product
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/products")
}

export type ExpenseInput = {
  serviceName: string
  amount: string
}

export async function createMonthlyRecord(
  productId: number,
  month: number,
  year: number,
  totalRevenue: string,
  expenseItems: ExpenseInput[]
) {
  const [record] = await db
    .insert(monthlyRecords)
    .values({
      productId,
      month,
      year,
      totalRevenue,
    })
    .returning()

  if (expenseItems.length > 0) {
    await db.insert(expenses).values(
      expenseItems.map((e) => ({
        recordId: record.id,
        serviceName: e.serviceName,
        amount: e.amount,
      }))
    )
  }

  revalidatePath("/entries")
  revalidatePath("/")
  return record
}

export async function getDashboardData() {
  const records = await db
    .select({
      id: monthlyRecords.id,
      productId: monthlyRecords.productId,
      month: monthlyRecords.month,
      year: monthlyRecords.year,
      totalRevenue: monthlyRecords.totalRevenue,
      productName: products.name,
      expenses: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`.as("total_expenses"),
    })
    .from(monthlyRecords)
    .leftJoin(products, eq(monthlyRecords.productId, products.id))
    .leftJoin(expenses, eq(monthlyRecords.id, expenses.recordId))
    .groupBy(monthlyRecords.id, products.name)
    .orderBy(monthlyRecords.year, monthlyRecords.month)

  const aggregated = new Map<
    string,
    { month: number; year: number; revenue: number; cost: number }
  >()

  for (const r of records) {
    const key = `${r.year}-${r.month}`
    const existing = aggregated.get(key)
    const revenue = Number(r.totalRevenue)
    const cost = Number(r.expenses)

    if (existing) {
      existing.revenue += revenue
      existing.cost += cost
    } else {
      aggregated.set(key, { month: r.month, year: r.year, revenue, cost })
    }
  }

  return Array.from(aggregated.values())
    .map((d) => ({
      ...d,
      profit: d.revenue - d.cost,
      label: `${d.year}-${String(d.month).padStart(2, "0")}`,
    }))
    .sort((a, b) => a.year - b.year || a.month - b.month)
}

export async function getCurrentMonthSummary() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const records = await db
    .select({
      totalRevenue: monthlyRecords.totalRevenue,
      expenses: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`.as("total_expenses"),
    })
    .from(monthlyRecords)
    .leftJoin(expenses, eq(monthlyRecords.id, expenses.recordId))
    .where(
      and(
        eq(monthlyRecords.month, currentMonth),
        eq(monthlyRecords.year, currentYear)
      )
    )
    .groupBy(monthlyRecords.id)

  let totalRevenue = 0
  let totalCost = 0

  for (const r of records) {
    totalRevenue += Number(r.totalRevenue)
    totalCost += Number(r.expenses)
  }

  return {
    revenue: totalRevenue,
    cost: totalCost,
    profit: totalRevenue - totalCost,
  }
}

export async function getMonthlyRecords() {
  return db
    .select({
      id: monthlyRecords.id,
      productId: monthlyRecords.productId,
      month: monthlyRecords.month,
      year: monthlyRecords.year,
      totalRevenue: monthlyRecords.totalRevenue,
      productName: products.name,
    })
    .from(monthlyRecords)
    .leftJoin(products, eq(monthlyRecords.productId, products.id))
    .orderBy(monthlyRecords.year, monthlyRecords.month)
}

export async function getRecordExpenses(recordId: number) {
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.recordId, recordId))
}

export async function deleteMonthlyRecord(id: number) {
  await db.delete(monthlyRecords).where(eq(monthlyRecords.id, id))
  revalidatePath("/entries")
  revalidatePath("/")
}
