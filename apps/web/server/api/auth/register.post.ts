import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../database/schema'
import { useDatabase } from '#layer/server/utils/database'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { hashPassword, createSession } from '../../utils/auth'

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(500),
  name: z.string().max(255).optional().default(''),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'auth', 10, 60_000)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const { email, password, name } = parsed.data
  const db = useDatabase(event)
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }
  const passwordHash = await hashPassword(password)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name: name || null,
    createdAt: now,
    updatedAt: now,
  })
  const user = await createSession(event, id)
  return { user }
})
