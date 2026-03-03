import { eq, sql } from 'drizzle-orm'
import { decks, cards } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const db = useDatabase(event)
  const [deck] = await db
    .select({
      id: decks.id,
      userId: decks.userId,
      name: decks.name,
      description: decks.description,
      tags: decks.tags,
      isPublic: decks.isPublic,
      createdAt: decks.createdAt,
      cardCount: sql<number>`count(${cards.id})`.as('card_count'),
    })
    .from(decks)
    .leftJoin(cards, eq(decks.id, cards.deckId))
    .where(eq(decks.id, id))
    .groupBy(decks.id)
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  return deck
})
