import { eq } from 'drizzle-orm'
import { decks, cards } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const db = useDatabase(event)
  const [deck] = await db.select().from(decks).where(eq(decks.id, id))
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  const cardList = await db.select().from(cards).where(eq(cards.deckId, id)).orderBy(cards.createdAt)
  let csv = 'front,back\n'
  for (const card of cardList) {
    const front = card.front.replaceAll('"', '""')
    const back = card.back.replaceAll('"', '""')
    csv += `"${front}","${back}"\n`
  }
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  const safeName = deck.name.replaceAll(/[^\w\s-]/g, '').trim() || 'deck'
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${safeName}.csv"`)
  return csv
})
