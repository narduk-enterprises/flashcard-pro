import { decks } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDatabase(event)
  const list = await db.select().from(decks).orderBy(decks.createdAt)
  return list
})
