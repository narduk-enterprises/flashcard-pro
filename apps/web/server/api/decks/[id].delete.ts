import { eq } from 'drizzle-orm'
import { decks } from '../../database/schema'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const db = useDatabase(event)
  const [deck] = await db.select().from(decks).where(eq(decks.id, id))
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  if (deck.userId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the deck owner can delete it' })
  }
  await db.delete(decks).where(eq(decks.id, id))
  return { ok: true }
})
