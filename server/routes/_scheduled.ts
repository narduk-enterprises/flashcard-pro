
/**
 * Cloudflare Workers Scheduled (Cron) Handler.
 * Runs every minute via the `* * * * *` trigger in wrangler.json.
 *
 * Flow:
 * 1. Init D1 & read bot config
 * 2. Fetch active binary markets from Gamma API
 * 3. Update market price cache in D1
 * 4. Scan for arbitrage opportunities
 * 5. Store opportunities in D1
 * 6. Log scan results
 */
export default defineNitroPlugin((nitroApp) => {
  // @ts-expect-error hooks type is loose for scheduled
  nitroApp.hooks.hook('cloudflare:scheduled', async (event: any) => {
    const startTime = Date.now()
    let marketsScanned = 0
    let opportunitiesFound = 0
    let tradesExecuted = 0
    let errorMsg: string | undefined

    try {
      // Init database from the CF env binding
      const env = event.env || {}
      if (env.DB) {
        initDatabase(env.DB)
      }
      const db = useDatabase()

      // 1. Read bot config
      const configs = await db.select().from(schema.botConfig).limit(1)
      const config = configs[0] || {
        active: false,
        dryRun: true,
        maxBetUsd: 50,
        minSpreadPct: 1.0,
      }

      // If bot is not active, log and exit
      if (!config.active) {
        await db.insert(schema.scanLogs).values({
          marketsScanned: 0,
          opportunitiesFound: 0,
          tradesExecuted: 0,
          durationMs: Date.now() - startTime,
          error: 'Bot is paused',
          createdAt: new Date().toISOString(),
        })
        return
      }

      // 2. Fetch active markets
      const polymarkets = await fetchActiveMarkets(200)
      marketsScanned = polymarkets.length

      // 3. Update market cache
      for (const m of polymarkets) {
        const { yesPrice, noPrice } = parseMarketPrices(m)
        await db
          .insert(schema.markets)
          .values({
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
          })
          .onConflictDoUpdate({
            target: schema.markets.id,
            set: {
              yesPrice,
              noPrice,
              volume: m.volume || 0,
              liquidity: m.liquidity || 0,
              active: m.active && !m.closed,
              updatedAt: new Date().toISOString(),
            },
          })
      }

      // 4. Scan for arbitrage
      const arbs = scanForArbitrage(polymarkets, config.minSpreadPct ?? 1.0)
      opportunitiesFound = arbs.length

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

      // 6. Future: if !config.dryRun, execute trades here
      // For now, all runs are observation-only

    } catch (err: any) {
      errorMsg = err.message || String(err)
      console.error('[scheduled] scan error:', errorMsg)
    } finally {
      // Log the scan result
      try {
        const db = useDatabase()
        await db.insert(schema.scanLogs).values({
          marketsScanned,
          opportunitiesFound,
          tradesExecuted,
          durationMs: Date.now() - startTime,
          error: errorMsg,
          createdAt: new Date().toISOString(),
        })
      } catch (logErr) {
        console.error('[scheduled] failed to log scan:', logErr)
      }
    }
  })
})
