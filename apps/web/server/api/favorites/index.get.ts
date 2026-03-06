import { eq } from 'drizzle-orm'
import { favorites, decks } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (!user) return []
  const db = useDatabase(event)
  const list = await db
    .select({
      id: favorites.id,
      deckId: favorites.deckId,
      createdAt: favorites.createdAt,
      deckName: decks.name,
      deckDescription: decks.description,
    })
    .from(favorites)
    .innerJoin(decks, eq(favorites.deckId, decks.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(favorites.createdAt)
  return list
})
