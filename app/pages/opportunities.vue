<script setup lang="ts">
useSeoMeta({
  title: 'Opportunities — Polymarket Arb Bot',
  description: 'Detected arbitrage opportunities across Polymarket prediction markets',
})

const { data: opportunities, refresh } = await useFetch('/api/opportunities', { query: { limit: 100 } })

const formatTime = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Auto-refresh
const refreshInterval = ref<any>(null)
onMounted(() => {
  refreshInterval.value = setInterval(() => refresh(), 30_000)
})
onUnmounted(() => clearInterval(refreshInterval.value))
</script>

<template>
  <div class="opps-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Opportunities</h1>
        <p class="page-subtitle">Arbitrage opportunities detected by the scanner</p>
      </div>
      <UButton variant="soft" @click="refresh()">
        <template #leading>
          <UIcon name="i-heroicons-arrow-path" />
        </template>
        Refresh
      </UButton>
    </div>

    <div class="section-card">
      <div v-if="!opportunities?.length" class="empty-state">
        <div class="empty-icon">⚡</div>
        <p>No opportunities found yet.</p>
        <p class="text-muted">Run a scan from the Dashboard to detect arbitrage.</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>YES Price</th>
              <th>NO Price</th>
              <th>Total Cost</th>
              <th>Spread</th>
              <th>Profit / $100</th>
              <th>Traded</th>
              <th>Detected</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="opp in opportunities" :key="opp.id">
              <td class="cell-question">{{ opp.question }}</td>
              <td>{{ (opp.yesPrice * 100).toFixed(1) }}¢</td>
              <td>{{ (opp.noPrice * 100).toFixed(1) }}¢</td>
              <td>{{ ((opp.yesPrice + opp.noPrice) * 100).toFixed(1) }}¢</td>
              <td class="text-accent font-mono">{{ (opp.spread * 100).toFixed(2) }}%</td>
              <td class="text-green font-mono">${{ opp.expectedProfit?.toFixed(2) }}</td>
              <td>
                <span class="traded-badge" :class="opp.traded ? 'traded-badge--yes' : 'traded-badge--no'">
                  {{ opp.traded ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="text-muted">{{ formatTime(opp.detectedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.opps-page {
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
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

.traded-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.traded-badge--yes { background: var(--green-bg); color: var(--green); }
.traded-badge--no { background: rgba(107, 114, 128, 0.15); color: var(--text-muted); }

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.empty-state p { margin: 0.25rem 0; }

.text-muted { color: var(--text-muted); }
.text-accent { color: var(--accent-light); }
.text-green { color: var(--green); }
</style>
