import { eq } from 'drizzle-orm'
import { collaborators, users } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing deck id' })
  const db = useDatabase(event)
  const list = await db
    .select({
      id: collaborators.id,
      userId: collaborators.userId,
      email: users.email,
      name: users.name,
      createdAt: collaborators.createdAt,
    })
    .from(collaborators)
    .innerJoin(users, eq(collaborators.userId, users.id))
    .where(eq(collaborators.deckId, id))
  return list
})
