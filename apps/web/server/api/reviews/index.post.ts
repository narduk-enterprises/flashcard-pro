import { eq } from 'drizzle-orm'
import { cards, reviews } from '../../database/schema'
import { z } from 'zod'

const bodySchema = z.object({
  cardId: z.string().uuid(),
  rating: z.number().int().min(1).max(4),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const db = useDatabase(event)
  const [card] = await db.select().from(cards).where(eq(cards.id, parsed.data.cardId))
  if (!card) throw createError({ statusCode: 404, message: 'Card not found' })
  const reviewId = crypto.randomUUID()
  await db.insert(reviews).values({
    id: reviewId,
    cardId: parsed.data.cardId,
    rating: parsed.data.rating,
  })
  const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId))
  return review
})
