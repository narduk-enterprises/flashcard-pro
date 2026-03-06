import { eq, and } from 'drizzle-orm'
import { favorites, decks } from '../../database/schema'
import { z } from 'zod'

const bodySchema = z.object({
  deckId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const db = useDatabase(event)
  const [deck] = await db.select().from(decks).where(eq(decks.id, parsed.data.deckId))
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  const [existing] = await db.select().from(favorites).where(
    and(eq(favorites.userId, user.id), eq(favorites.deckId, parsed.data.deckId)),
  )
  if (existing) return existing
  const id = crypto.randomUUID()
  await db.insert(favorites).values({
    id,
    userId: user.id,
    deckId: parsed.data.deckId,
  })
  const [fav] = await db.select().from(favorites).where(eq(favorites.id, id))
  return fav
})
