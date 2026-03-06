import { eq, and } from 'drizzle-orm'
import { collaborators, decks, users } from '../../../database/schema'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const db = useDatabase(event)
  const [deck] = await db.select().from(decks).where(eq(decks.id, id))
  if (!deck) throw createError({ statusCode: 404, message: 'Deck not found' })
  if (deck.userId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the deck owner can add collaborators' })
  }
  const [targetUser] = await db.select().from(users).where(eq(users.email, parsed.data.email))
  if (!targetUser) throw createError({ statusCode: 404, message: 'User not found' })
  if (targetUser.id === user.id) {
    throw createError({ statusCode: 400, message: 'You are already the owner' })
  }
  const [existing] = await db.select().from(collaborators).where(
    and(eq(collaborators.deckId, id), eq(collaborators.userId, targetUser.id)),
  )
  if (existing) return existing
  const collabId = crypto.randomUUID()
  await db.insert(collaborators).values({
    id: collabId,
    deckId: id,
    userId: targetUser.id,
  })
  const [collab] = await db.select().from(collaborators).where(eq(collaborators.id, collabId))
  return collab
})
