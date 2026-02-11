import { desc } from 'drizzle-orm'

/**
 * GET /api/markets — list cached markets with latest prices
 */
export default defineEventHandler(async (event) => {
  const db = useDatabase()
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = Number(query.offset) || 0

  const rows = await db
    .select()
    .from(markets)
    .orderBy(desc(markets.volume))
    .limit(limit)
    .offset(offset)

  return rows
})
