import { eq } from 'drizzle-orm'
import { cards } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const db = useDatabase(event)
  const list = await db.select().from(cards).where(eq(cards.deckId, id)).orderBy(cards.createdAt)
  return list
})
