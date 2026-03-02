import { z } from 'zod'
import { like, or, desc } from 'drizzle-orm'
import { decks } from '../../database/schema'

const querySchema = z.object({
  q: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const raw = getQuery(event)
  const query = querySchema.parse(raw)
  const q = (query.q ?? '').trim()
  const db = useDatabase(event)
  if (!q) {
    const list = await db.select().from(decks).orderBy(desc(decks.createdAt))
    return list
  }
  const pattern = `%${q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
  const list = await db
    .select()
    .from(decks)
    .where(or(like(decks.name, pattern), like(decks.description, pattern)))
    .orderBy(desc(decks.createdAt))
  return list
})
