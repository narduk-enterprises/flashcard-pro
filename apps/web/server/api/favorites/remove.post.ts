import { eq, and } from 'drizzle-orm'
import { favorites } from '../../database/schema'
import { z } from 'zod'
import { requireUser } from '../../utils/auth'

const bodySchema = z.object({
  deckId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const db = useDatabase(event)
  await db.delete(favorites).where(
    and(eq(favorites.userId, user.id), eq(favorites.deckId, parsed.data.deckId)),
  )
  return { ok: true }
})
