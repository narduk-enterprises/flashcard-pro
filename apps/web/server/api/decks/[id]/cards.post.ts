import { eq, and } from 'drizzle-orm'
import { cards, decks, collaborators } from '../../../database/schema'
import { z } from 'zod'

const bodySchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
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
  const isOwner = deck.userId === user.id
  const [isCollab] = await db.select().from(collaborators).where(
    and(eq(collaborators.deckId, id), eq(collaborators.userId, user.id)),
  )
  if (!isOwner && !isCollab) {
    throw createError({ statusCode: 403, message: 'Only the deck owner or collaborators can add cards' })
  }
  const cardId = crypto.randomUUID()
  await db.insert(cards).values({
    id: cardId,
    deckId: id,
    front: parsed.data.front,
    back: parsed.data.back,
  })
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId))
  return card
})
