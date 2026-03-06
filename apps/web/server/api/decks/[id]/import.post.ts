import { eq } from 'drizzle-orm'
import { decks, cards } from '../../../database/schema'
import { z } from 'zod'

const cardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
})

const bodySchema = z.object({
  cards: z.array(cardSchema).min(1).max(500),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const db = useDatabase(event)
  const [deck] = await db.select().from(decks).where(eq(decks.id, id))
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  if (deck.userId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the deck owner can import cards' })
  }
  const values = parsed.data.cards.map(c => ({
    id: crypto.randomUUID(),
    deckId: id,
    front: c.front,
    back: c.back,
  }))
  await db.insert(cards).values(values)
  return { imported: values.length }
})
