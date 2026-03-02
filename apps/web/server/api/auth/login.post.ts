import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../database/schema'
import { useDatabase } from '#layer/server/utils/database'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { verifyPassword, createSession } from '../../utils/auth'

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(500),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'auth', 10, 60_000)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const { email, password } = parsed.data
  const db = useDatabase(event)
  const [row] = await db.select().from(users).where(eq(users.email, email))
  if (!row?.passwordHash) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }
  const ok = await verifyPassword(password, row.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }
  const user = await createSession(event, row.id)
  return { user }
})
