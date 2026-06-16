import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

/** Returns the signed-in user's id, or redirects to /login if there is none. */
export async function requireUserId() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  return user.id
}
