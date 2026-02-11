import { desc, sql, count, sum } from 'drizzle-orm'

/**
 * GET /api/stats — aggregate dashboard statistics
 */
export default defineEventHandler(async () => {
  const db = useDatabase()

  // Total scans
  const [scanCount] = await db.select({ total: count() }).from(scanLogs)

  // Total opportunities found
  const [oppCount] = await db.select({ total: count() }).from(opportunities)

  // Total trades
  const [tradeCount] = await db.select({ total: count() }).from(trades)

  // Net P&L
  const [pnlResult] = await db.select({ total: sum(trades.pnl) }).from(trades)

  // Last scan
  const lastScan = await db.select().from(scanLogs).orderBy(desc(scanLogs.createdAt)).limit(1)

  // Active markets count
  const [marketCount] = await db.select({ total: count() }).from(markets)

  // Bot config
  const config = await db.select().from(botConfig).limit(1)

  return {
    totalScans: scanCount?.total || 0,
    totalOpportunities: oppCount?.total || 0,
    totalTrades: tradeCount?.total || 0,
    netPnl: Number(pnlResult?.total || 0),
    lastScan: lastScan[0] || null,
    activeMarkets: marketCount?.total || 0,
    config: config[0] || { active: false, dryRun: true, maxBetUsd: 50, minSpreadPct: 1.0, startingBalance: 1000 },
  }
})
