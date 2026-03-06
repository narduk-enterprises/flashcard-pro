import { eq } from 'drizzle-orm'
import { decks } from '../../database/schema'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional().default(''),
  categoryId: z.string().optional(),
  tags: z.string().max(500).optional().default(''),
  isPublic: z.boolean().optional().default(true),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid body', data: parsed.error.flatten() })
  }
  const db = useDatabase(event)
  const id = crypto.randomUUID()
  await db.insert(decks).values({
    id,
    userId: user.id,
    categoryId: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description,
    tags: parsed.data.tags,
    isPublic: parsed.data.isPublic,
  })
  const [deck] = await db.select().from(decks).where(eq(decks.id, id))
  return deck
})
