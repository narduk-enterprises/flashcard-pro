<script setup lang="ts">
useSeoMeta({
  title: 'Trades — Polymarket Arb Bot',
  description: 'Trade execution history for the Polymarket arbitrage bot',
})

const { data: trades, refresh } = await useFetch('/api/trades', { query: { limit: 100 } })

const formatTime = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatPnl = (v: number | null) => {
  if (v === null || v === undefined) return '—'
  const sign = v >= 0 ? '+' : ''
  return `${sign}$${v.toFixed(2)}`
}

const statusClass = (s: string) => {
  switch (s) {
    case 'filled': return 'status--filled'
    case 'pending': return 'status--pending'
    case 'failed': return 'status--failed'
    case 'cancelled': return 'status--cancelled'
    default: return ''
  }
}
</script>

<template>
  <div class="trades-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Trades</h1>
        <p class="page-subtitle">Trade execution history and P&L tracking</p>
      </div>
      <UButton variant="soft" @click="refresh()">
        <template #leading>
          <UIcon name="i-heroicons-arrow-path" />
        </template>
        Refresh
      </UButton>
    </div>

    <div class="section-card">
      <div v-if="!trades?.length" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No trades executed yet.</p>
        <p class="text-muted">The bot is in dry-run mode. Enable live trading in Settings to execute trades.</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>Side</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Status</th>
              <th>P&L</th>
              <th>TX Hash</th>
              <th>Executed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in trades" :key="trade.id">
              <td class="cell-question">{{ trade.marketQuestion || trade.marketId }}</td>
              <td>
                <span class="side-badge" :class="trade.side === 'YES' ? 'side-badge--yes' : 'side-badge--no'">
                  {{ trade.side }}
                </span>
              </td>
              <td class="font-mono">${{ trade.amount?.toFixed(2) }}</td>
              <td class="font-mono">{{ (trade.price * 100).toFixed(1) }}¢</td>
              <td>
                <span class="status-pill" :class="statusClass(trade.status)">
                  {{ trade.status }}
                </span>
              </td>
              <td class="font-mono" :class="(trade.pnl || 0) >= 0 ? 'text-green' : 'text-red'">
                {{ formatPnl(trade.pnl) }}
              </td>
              <td class="cell-hash text-muted">{{ trade.txHash || '—' }}</td>
              <td class="text-muted">{{ formatTime(trade.executedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trades-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
}
.page-subtitle {
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
}

.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.data-table th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}
.data-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--bg-card-hover); }

.cell-question {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cell-hash {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
}

.font-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

.side-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}
.side-badge--yes { background: var(--green-bg); color: var(--green); }
.side-badge--no { background: var(--red-bg); color: var(--red); }

.status-pill {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.status--filled { background: var(--green-bg); color: var(--green); }
.status--pending { background: var(--yellow-bg); color: var(--yellow); }
.status--failed { background: var(--red-bg); color: var(--red); }
.status--cancelled { background: rgba(107, 114, 128, 0.15); color: var(--text-muted); }

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.empty-state p { margin: 0.25rem 0; }

.text-muted { color: var(--text-muted); }
.text-green { color: var(--green); }
.text-red { color: var(--red); }
</style>
