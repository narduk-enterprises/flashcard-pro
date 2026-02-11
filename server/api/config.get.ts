import { eq } from 'drizzle-orm'

/**
 * GET /api/config — get bot configuration
 */
export default defineEventHandler(async () => {
  const db = useDatabase()
  const rows = await db.select().from(botConfig).limit(1)

  if (rows.length === 0) {
    // Return defaults if no config exists
    return {
      id: 1,
      active: false,
      dryRun: true,
      maxBetUsd: 50,
      minSpreadPct: 1.0,
      startingBalance: 1000,
      updatedAt: new Date().toISOString()
    }
  }

  return rows[0]
})
