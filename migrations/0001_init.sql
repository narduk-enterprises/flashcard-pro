-- Polymarket Arb Bot — D1 Schema Migration
-- Run via: wrangler d1 execute polymarket-arb-db --remote --file=./migrations/0001_init.sql

-- Markets cache
CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  yes_token_id TEXT NOT NULL DEFAULT '',
  no_token_id TEXT NOT NULL DEFAULT '',
  yes_price REAL NOT NULL DEFAULT 0,
  no_price REAL NOT NULL DEFAULT 0,
  volume REAL NOT NULL DEFAULT 0,
  liquidity REAL NOT NULL DEFAULT 0,
  end_date TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Detected arbitrage opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id TEXT NOT NULL REFERENCES markets(id),
  question TEXT NOT NULL DEFAULT '',
  yes_price REAL NOT NULL DEFAULT 0,
  no_price REAL NOT NULL DEFAULT 0,
  spread REAL NOT NULL DEFAULT 0,
  expected_profit REAL NOT NULL DEFAULT 0,
  traded INTEGER NOT NULL DEFAULT 0,
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Executed trades
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id INTEGER REFERENCES opportunities(id),
  market_id TEXT NOT NULL,
  market_question TEXT NOT NULL DEFAULT '',
  side TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  pnl REAL,
  executed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cron scan logs
CREATE TABLE IF NOT EXISTS scan_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  markets_scanned INTEGER NOT NULL DEFAULT 0,
  opportunities_found INTEGER NOT NULL DEFAULT 0,
  trades_executed INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bot configuration (singleton)
CREATE TABLE IF NOT EXISTS bot_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 0,
  dry_run INTEGER NOT NULL DEFAULT 1,
  max_bet_usd REAL NOT NULL DEFAULT 50,
  min_spread_pct REAL NOT NULL DEFAULT 1.0,
  starting_balance REAL NOT NULL DEFAULT 1000,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default config
INSERT OR IGNORE INTO bot_config (id, active, dry_run, max_bet_usd, min_spread_pct, starting_balance)
VALUES (1, 0, 1, 50, 1.0, 1000);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_market ON opportunities(market_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_detected ON opportunities(detected_at);
CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created ON scan_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(active);
