#!/usr/bin/env npx jiti

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { v4 as uuidv4 } from 'uuid'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const WEB_DIR = resolve(ROOT, 'apps/web')
const DRIZZLE_DIR = resolve(WEB_DIR, 'drizzle')

function runWrangler(sqlPath: string, local = true) {
    const env = local ? '--local' : '--remote'
    execSync(
        `pnpm exec wrangler d1 execute flashcard-pro-db ${env} --file=${sqlPath}`,
        { cwd: WEB_DIR, stdio: 'inherit' },
    )
}

const now = new Date().toISOString()

const categories = [
    { name: 'Programming', slug: 'programming', icon: 'i-lucide-code', description: 'Software engineering, languages, and frameworks.' },
    { name: 'Languages', slug: 'languages', icon: 'i-lucide-languages', description: 'Learn to speak new languages.' },
    { name: 'Science', slug: 'science', icon: 'i-lucide-test-tube', description: 'Biology, Physics, Chemistry, and more.' },
    { name: 'History', slug: 'history', icon: 'i-lucide-landmark', description: 'Historical events, figures, and dates.' },
    { name: 'Geography', slug: 'geography', icon: 'i-lucide-globe', description: 'Countries, capitals, and natural landmarks.' },
]

const demoDecks = [
    {
        categorySlug: 'programming',
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
        categorySlug: 'programming',
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
        categorySlug: 'languages',
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

function buildSeedSql(): string {
    const lines: string[] = ['-- Seed Categories and Decks']

    // 1. Delete existing for a clean slate
    lines.push('DELETE FROM categories;')
    lines.push('DELETE FROM decks WHERE user_id IS NULL;')
    lines.push('DELETE FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE user_id IS NULL);')

    // 2. Insert Categories
    const categoryIds: Record<string, string> = {}

    for (const cat of categories) {
        const id = uuidv4()
        categoryIds[cat.slug] = id
        lines.push(
            `INSERT INTO categories (id, name, slug, icon, description, created_at) VALUES ('${id}', '${cat.name.replace(/'/g, "''")}', '${cat.slug}', '${cat.icon}', '${cat.description.replace(/'/g, "''")}', '${now}');`
        )
    }

    // 3. Insert Decks
    for (const deck of demoDecks) {
        const deckId = uuidv4()
        const catId = categoryIds[deck.categorySlug] || 'NULL'

        lines.push(
            `INSERT INTO decks (id, user_id, category_id, name, description, created_at) VALUES ('${deckId}', NULL, '${catId}', '${deck.name.replace(/'/g, "''")}', '${deck.description.replace(/'/g, "''")}', '${now}');`,
        )

        // 4. Insert Cards
        for (const [front, back] of deck.cards) {
            const cardId = uuidv4()
            lines.push(
                `INSERT INTO cards (id, deck_id, front, back, created_at) VALUES ('${cardId}', '${deckId}', '${front.replace(/'/g, "''")}', '${back.replace(/'/g, "''")}', '${now}');`,
            )
        }
    }

    return lines.join('\n')
}

async function main() {
    const isProd = process.argv.includes('--remote')

    mkdirSync(DRIZZLE_DIR, { recursive: true })
    const seedPath = resolve(DRIZZLE_DIR, 'seed-categories.sql')

    console.log(`🌱 Generating and running category seed (${isProd ? 'REMOTE' : 'LOCAL'})...`)
    writeFileSync(seedPath, buildSeedSql(), 'utf8')
    runWrangler(seedPath, !isProd)
    console.log('   ✅ Categories and Decks seeded.\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
