#!/usr/bin/env npx jiti
/**
 * Cleanup E2E test data from production D1 and seed 10 demo flashcard decks.
 *
 * Usage (from repo root):
 *   pnpm exec tsx tools/cleanup-e2e-and-seed-prod.ts
 *
 * Requires: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (or Doppler) so
 *   wrangler d1 execute --remote works. Run from repo root.
 *
 * 1. Deletes users where email LIKE 'e2e-%@example.com' and their sessions,
 *    decks, cards, and reviews.
 * 2. Inserts 10 demo decks (user_id NULL) with multiple cards each.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const WEB_DIR = resolve(ROOT, 'apps/web')
const DRIZZLE_DIR = resolve(WEB_DIR, 'drizzle')

const DB_NAME = 'flashcard-pro-db'

function runWrangler(sqlPath: string) {
  execSync(
    `pnpm exec wrangler d1 execute ${DB_NAME} --remote --file=${sqlPath}`,
    { cwd: WEB_DIR, stdio: 'inherit' },
  )
}

// ─── Cleanup: E2E-named decks (often user_id NULL) + E2E users and their data ─
const cleanupSql = `-- 1) Decks named like "E2E ..." (and their cards/reviews), including unowned
DELETE FROM reviews WHERE card_id IN (
  SELECT id FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE name LIKE 'E2E%')
);
DELETE FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE name LIKE 'E2E%');
DELETE FROM decks WHERE name LIKE 'E2E%';

-- 2) E2E test users (e2e-...@example.com) and their sessions, decks, cards, reviews
DELETE FROM reviews WHERE card_id IN (
  SELECT c.id FROM cards c
  INNER JOIN decks d ON c.deck_id = d.id
  INNER JOIN users u ON d.user_id = u.id
  WHERE u.email LIKE 'e2e-%@example.com'
);
DELETE FROM cards WHERE deck_id IN (
  SELECT d.id FROM decks d
  INNER JOIN users u ON d.user_id = u.id
  WHERE u.email LIKE 'e2e-%@example.com'
);
DELETE FROM decks WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'e2e-%@example.com'
);
DELETE FROM sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'e2e-%@example.com'
);
DELETE FROM users WHERE email LIKE 'e2e-%@example.com';
`

// ─── Demo decks: 10 decks with cards (user_id NULL for discover) ───────────
const now = new Date().toISOString()

const demoDecks: { name: string; description: string; cards: [string, string][] }[] = [
  {
    name: 'JavaScript Basics',
    description: 'Variables, types, and functions in JS.',
    cards: [
      ['What keyword declares a constant?', 'const'],
      ['What is typeof null in JavaScript?', '"object" (historic bug)'],
      ['How do you define an arrow function?', 'const fn = () => {}'],
      ['What does === compare?', 'Value and type (no coercion)'],
    ],
  },
  {
    name: 'Vue 3 Composition API',
    description: 'ref, reactive, and composables.',
    cards: [
      ['Which function makes a reactive ref?', 'ref()'],
      ['reactive() is for ___.', 'Objects (ref for primitives)'],
      ['How do you read ref value in script?', '.value'],
      ['Lifecycle hook for mounted?', 'onMounted()'],
    ],
  },
  {
    name: 'SQL Fundamentals',
    description: 'SELECT, WHERE, and JOIN.',
    cards: [
      ['Keyword to filter rows?', 'WHERE'],
      ['Join that keeps only matching rows?', 'INNER JOIN'],
      ['Aggregate to count rows?', 'COUNT(*)'],
      ['Sort results with ___', 'ORDER BY'],
    ],
  },
  {
    name: 'HTTP Status Codes',
    description: 'Common REST API status codes.',
    cards: [
      ['200 means ___', 'OK (success)'],
      ['201 means ___', 'Created'],
      ['404 means ___', 'Not Found'],
      ['500 means ___', 'Internal Server Error'],
    ],
  },
  {
    name: 'Git Commands',
    description: 'Essential Git workflow.',
    cards: [
      ['Stage all changes', 'git add .'],
      ['Commit with message', 'git commit -m "message"'],
      ['Push to remote', 'git push'],
      ['Create and switch to branch', 'git checkout -b <name>'],
    ],
  },
  {
    name: 'TypeScript Types',
    description: 'Interfaces and type safety.',
    cards: [
      ['Declare an interface', 'interface Name { ... }'],
      ['Optional property in interface?', 'prop?: Type'],
      ['Array of strings type', 'string[]'],
      ['Generic with constraint', '<T extends SomeType>'],
    ],
  },
  {
    name: 'CSS Flexbox',
    description: 'Layout with display: flex.',
    cards: [
      ['Center items on main axis', 'justify-content: center'],
      ['Center on cross axis', 'align-items: center'],
      ['Direction column', 'flex-direction: column'],
      ['Wrap items to next line', 'flex-wrap: wrap'],
    ],
  },
  {
    name: 'Nuxt 4 Key Concepts',
    description: 'useAsyncData, server routes, and layers.',
    cards: [
      ['Fetch data for SSR', 'useAsyncData() or useFetch()'],
      ['Server API route folder', 'server/api/'],
      ['Composable for SEO title/desc', 'useSeo()'],
      ['Shared config and components', 'Nuxt Layer'],
    ],
  },
  {
    name: 'World Capitals',
    description: 'A few country capitals.',
    cards: [
      ['France', 'Paris'],
      ['Japan', 'Tokyo'],
      ['Brazil', 'Brasília'],
      ['Egypt', 'Cairo'],
    ],
  },
  {
    name: 'Spanish 101',
    description: 'Common phrases.',
    cards: [
      ['Hello', 'Hola'],
      ['Thank you', 'Gracias'],
      ['Good morning', 'Buenos días'],
      ['How are you?', '¿Cómo estás?'],
    ],
  },
]

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function buildSeedSql(): string {
  const lines: string[] = ['-- Demo decks and cards (user_id NULL for discover)']
  for (const deck of demoDecks) {
    const deckId = uuid()
    lines.push(
      `INSERT INTO decks (id, user_id, name, description, created_at) VALUES ('${deckId}', NULL, '${deck.name.replace(/'/g, "''")}', '${deck.description.replace(/'/g, "''")}', '${now}');`,
    )
    for (const [front, back] of deck.cards) {
      const cardId = uuid()
      lines.push(
        `INSERT INTO cards (id, deck_id, front, back, created_at) VALUES ('${cardId}', '${deckId}', '${front.replace(/'/g, "''")}', '${back.replace(/'/g, "''")}', '${now}');`,
      )
    }
  }
  return lines.join('\n')
}

async function main() {
  mkdirSync(DRIZZLE_DIR, { recursive: true })

  const cleanupPath = resolve(DRIZZLE_DIR, 'cleanup-e2e-prod.sql')
  const seedPath = resolve(DRIZZLE_DIR, 'seed-demo-prod.sql')

  console.log('🧹 Writing cleanup SQL (E2E users and their data)...')
  writeFileSync(cleanupPath, cleanupSql, 'utf8')
  console.log('   Running cleanup against remote D1...')
  runWrangler(cleanupPath)
  console.log('   ✅ Cleanup done.\n')

  console.log('🌱 Generating and running demo seed (10 decks)...')
  writeFileSync(seedPath, buildSeedSql(), 'utf8')
  runWrangler(seedPath)
  console.log('   ✅ Demo seed done.\n')

  console.log('Done. Production D1: E2E data removed, 10 demo decks seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
