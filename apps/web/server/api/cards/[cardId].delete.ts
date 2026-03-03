import { eq, and } from 'drizzle-orm'
import { cards, decks, collaborators } from '../../database/schema'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const cardId = getRouterParam(event, 'cardId')
  if (!cardId) throw createError({ statusCode: 400, message: 'Missing card id' })
  const db = useDatabase(event)
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!card) throw createError({ statusCode: 404, message: 'Card not found' })
  const [deck] = await db.select().from(decks).where(eq(decks.id, card.deckId))
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  const isOwner = deck.userId === user.id
  const [isCollab] = await db.select().from(collaborators).where(
    and(eq(collaborators.deckId, deck.id), eq(collaborators.userId, user.id)),
  )
  if (!isOwner && !isCollab) {
    throw createError({ statusCode: 403, message: 'Only the deck owner or collaborators can delete cards' })
  }
  await db.delete(cards).where(eq(cards.id, cardId))
  return { ok: true }
})
