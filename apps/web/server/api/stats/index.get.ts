import { eq, sql, count } from 'drizzle-orm'
import { decks, cards, reviews } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (!user) return { totalDecks: 0, totalCards: 0, totalReviews: 0, averageRating: 0 }
  const db = useDatabase(event)

  const [deckCount] = await db
    .select({ value: count() })
    .from(decks)
    .where(eq(decks.userId, user.id))

  const [cardCount] = await db
    .select({ value: count() })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(eq(decks.userId, user.id))

  const [reviewCount] = await db
    .select({ value: count() })
    .from(reviews)
    .innerJoin(cards, eq(reviews.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(eq(decks.userId, user.id))

  const [avgRating] = await db
    .select({ value: sql<number>`avg(${reviews.rating})` })
    .from(reviews)
    .innerJoin(cards, eq(reviews.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(eq(decks.userId, user.id))

  return {
    totalDecks: deckCount?.value ?? 0,
    totalCards: cardCount?.value ?? 0,
    totalReviews: reviewCount?.value ?? 0,
    averageRating: avgRating?.value ? Math.round(avgRating.value * 100) / 100 : 0,
  }
})
