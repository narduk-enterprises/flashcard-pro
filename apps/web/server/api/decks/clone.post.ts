import { eq } from 'drizzle-orm'
import { decks, cards } from '../../database/schema'
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
  const [sourceDeck] = await db.select().from(decks).where(eq(decks.id, parsed.data.deckId))
  if (!sourceDeck) throw createError({ statusCode: 404, message: 'Deck not found' })
  const sourceCards = await db.select().from(cards).where(eq(cards.deckId, sourceDeck.id))
  const newDeckId = crypto.randomUUID()
  await db.insert(decks).values({
    id: newDeckId,
    userId: user.id,
    name: sourceDeck.name,
    description: sourceDeck.description,
    tags: sourceDeck.tags,
    isPublic: sourceDeck.isPublic,
  })
  if (sourceCards.length > 0) {
    const newCards = sourceCards.map(c => ({
      id: crypto.randomUUID(),
      deckId: newDeckId,
      front: c.front,
      back: c.back,
    }))
    await db.insert(cards).values(newCards)
  }
  const [newDeck] = await db.select().from(decks).where(eq(decks.id, newDeckId))
  return newDeck
})
