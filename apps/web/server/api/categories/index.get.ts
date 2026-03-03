import { categories } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const db = useDatabase(event)
    const results = await db.select().from(categories).all()
    return results
})
