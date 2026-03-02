import { getSessionFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getSessionFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  return { user }
})
