import { z } from 'zod'
import { like, or, desc, eq, sql } from 'drizzle-orm'
import { decks, cards } from '../../database/schema'

const querySchema = z.object({
  q: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const raw = getQuery(event)
  const query = querySchema.parse(raw)
  const q = (query.q ?? '').trim()
  const db = useDatabase(event)

  const baseQuery = db
    .select({
      id: decks.id,
      userId: decks.userId,
      name: decks.name,
      description: decks.description,
      createdAt: decks.createdAt,
      cardCount: sql<number>`count(${cards.id})`.as('card_count'),
    })
    .from(decks)
    .leftJoin(cards, eq(decks.id, cards.deckId))
    .groupBy(decks.id)
    .orderBy(desc(decks.createdAt))

  if (!q) {
    return await baseQuery
  }
  const pattern = `%${q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
  return await baseQuery.where(or(like(decks.name, pattern), like(decks.description, pattern)))
})
