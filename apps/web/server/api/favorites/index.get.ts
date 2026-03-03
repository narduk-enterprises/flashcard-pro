import { eq } from 'drizzle-orm'
import { favorites, decks } from '../../database/schema'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
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
