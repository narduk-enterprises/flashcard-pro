/**
 * Arbitrage detection logic for Polymarket binary markets.
 *
 * Intra-market arbitrage: if YES_price + NO_price < 1.0, buying both
 * sides guarantees 1.0 on resolution, netting the spread as profit.
 *
 * Example: YES = 0.48, NO = 0.48 → Total = 0.96 → Spread = 0.04 (4%)
 *          Buy $500 YES + $500 NO → guaranteed $1000 payout, paid $960 → $40 profit
 */

import type { PolymarketMarket } from './polymarket'
import { parseMarketPrices } from './polymarket'

export interface ArbitrageOpportunity {
  marketId: string
  question: string
  slug: string
  yesPrice: number
  noPrice: number
  totalCost: number  // yes + no (should be < 1.0 for arb)
  spread: number     // 1.0 - totalCost (positive = profit per $1)
  spreadPct: number  // spread as percentage
  expectedProfitPer100: number // profit per $100 invested
  volume: number
  liquidity: number
}

/**
 * Scan a list of markets for arbitrage opportunities.
 * Returns opportunities sorted by spread (most profitable first).
 */
export function scanForArbitrage(
  markets: PolymarketMarket[],
  minSpreadPct: number = 0.5
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = []

  for (const market of markets) {
    const { yesPrice, noPrice } = parseMarketPrices(market)

    // Skip markets with invalid/zero prices
    if (yesPrice <= 0 || noPrice <= 0) continue
    if (yesPrice >= 1 || noPrice >= 1) continue

    const totalCost = yesPrice + noPrice
    const spread = 1.0 - totalCost

    // Only flag if there's a positive spread above threshold
    if (spread <= 0) continue

    const spreadPct = spread * 100

    if (spreadPct < minSpreadPct) continue

    opportunities.push({
      marketId: market.id,
      question: market.question,
      slug: market.slug || '',
      yesPrice,
      noPrice,
      totalCost,
      spread,
      spreadPct,
      expectedProfitPer100: spread * 100, // $profit per $100 wagered
      volume: market.volume || 0,
      liquidity: market.liquidity || 0,
    })
  }

  // Sort by spread descending (most profitable first)
  return opportunities.sort((a, b) => b.spread - a.spread)
}

/**
 * Calculate the optimal position size for an arbitrage trade.
 * Caps at maxBet, and ensures we don't exceed available liquidity.
 */
export function calculatePositionSize(
  spread: number,
  maxBetUsd: number,
  availableLiquidity: number
): { yesAmount: number; noAmount: number; totalCost: number; expectedProfit: number } {
  // Total investment is split proportionally between YES and NO
  const maxInvestment = Math.min(maxBetUsd, availableLiquidity * 0.1) // don't take more than 10% of liquidity
  const totalCost = maxInvestment
  const expectedProfit = totalCost * spread

  // Split investment proportionally
  // For $X total: buy YES shares worth $X * noPrice/(yesPrice+noPrice)
  //               buy NO shares worth  $X * yesPrice/(yesPrice+noPrice)
  // Actually simpler: just buy $totalCost/2 of each side (since arb means buying both)
  const perSide = totalCost / 2

  return {
    yesAmount: perSide,
    noAmount: perSide,
    totalCost,
    expectedProfit
  }
}
