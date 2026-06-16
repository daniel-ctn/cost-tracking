"use server"

import { db } from "@/lib/db"
import { products, monthlyRecords, expenses } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
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

export type DashboardRow = {
  productId: number
  productName: string | null
  month: number
  year: number
  revenue: number
  cost: number
}

export async function getDashboardData(): Promise<DashboardRow[]> {
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
    .leftJoin(products, eq(monthlyRecords.productId, products.id))
    .leftJoin(expenses, eq(monthlyRecords.id, expenses.recordId))
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
