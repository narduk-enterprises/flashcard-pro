import { like, or, desc } from 'drizzle-orm'
import { decks } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const db = useDatabase(event)
  if (!q) {
    const list = await db.select().from(decks).orderBy(desc(decks.createdAt))
    return list
  }
  const pattern = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
  const list = await db
    .select()
    .from(decks)
    .where(or(like(decks.name, pattern), like(decks.description, pattern)))
    .orderBy(desc(decks.createdAt))
  return list
})
