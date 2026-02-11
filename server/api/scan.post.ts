import { desc } from 'drizzle-orm'

/**
 * POST /api/scan — manually trigger an arbitrage scan.
 * Same logic as the cron worker but callable via API for testing.
 */
export default defineEventHandler(async (event) => {
  const db = useDatabase()
  const startTime = Date.now()

  try {
    // 1. Read bot config
    const configs = await db.select().from(schema.botConfig).limit(1)
    const config = configs[0] || { active: false, dryRun: true, maxBetUsd: 50, minSpreadPct: 1.0 }

    // 2. Fetch active markets from Polymarket
    const polymarkets = await fetchActiveMarkets(200)

    // 3. Update market cache in D1
    for (const m of polymarkets) {
      const { yesPrice, noPrice } = parseMarketPrices(m)
      await db.insert(schema.markets).values({
        id: m.id,
        question: m.question,
        slug: m.slug || '',
        yesTokenId: m.clobTokenIds?.[0] || '',
        noTokenId: m.clobTokenIds?.[1] || '',
        yesPrice,
        noPrice,
        volume: m.volume || 0,
        liquidity: m.liquidity || 0,
        endDate: m.endDate || '',
        active: m.active && !m.closed,
        updatedAt: new Date().toISOString(),
      }).onConflictDoUpdate({
        target: schema.markets.id,
        set: {
          yesPrice,
          noPrice,
          volume: m.volume || 0,
          liquidity: m.liquidity || 0,
          active: m.active && !m.closed,
          updatedAt: new Date().toISOString(),
        }
      })
    }

    // 4. Scan for arbitrage
    const arbs = scanForArbitrage(polymarkets, config.minSpreadPct ?? 1.0)

    // 5. Store opportunities
    for (const arb of arbs) {
      await db.insert(schema.opportunities).values({
        marketId: arb.marketId,
        question: arb.question,
        yesPrice: arb.yesPrice,
        noPrice: arb.noPrice,
        spread: arb.spread,
        expectedProfit: arb.expectedProfitPer100,
        traded: false,
        detectedAt: new Date().toISOString(),
      })
    }

    // 6. Log the scan
    const durationMs = Date.now() - startTime
    await db.insert(schema.scanLogs).values({
      marketsScanned: polymarkets.length,
      opportunitiesFound: arbs.length,
      tradesExecuted: 0,
      durationMs,
      createdAt: new Date().toISOString(),
    })

    return {
      success: true,
      marketsScanned: polymarkets.length,
      opportunitiesFound: arbs.length,
      opportunities: arbs.slice(0, 10), // return top 10
      durationMs,
    }
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    // Log error
    await db.insert(schema.scanLogs).values({
      marketsScanned: 0,
      opportunitiesFound: 0,
      tradesExecuted: 0,
      durationMs,
      error: error.message || String(error),
      createdAt: new Date().toISOString(),
    }).catch(() => {}) // don't throw on log error

    return {
      success: false,
      error: error.message || 'Unknown error',
      durationMs,
    }
  }
})
