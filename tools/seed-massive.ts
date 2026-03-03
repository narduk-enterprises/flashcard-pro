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

// We need 30 categories
const categories = [
    { name: 'Computer Science', slug: 'computer-science', icon: 'i-lucide-monitor', description: 'Algorithms, data structures, and theory.' },
    { name: 'Mathematics', slug: 'mathematics', icon: 'i-lucide-calculator', description: 'Calculus, algebra, geometry, and logic.' },
    { name: 'Physics', slug: 'physics', icon: 'i-lucide-atom', description: 'Mechanics, electromagnetism, and relativity.' },
    { name: 'Chemistry', slug: 'chemistry', icon: 'i-lucide-flask-conical', description: 'Elements, compounds, and reactions.' },
    { name: 'Biology', slug: 'biology', icon: 'i-lucide-dna', description: 'Life sciences, anatomy, and genetics.' },
    { name: 'Medicine', slug: 'medicine', icon: 'i-lucide-stethoscope', description: 'Anatomy, diseases, and treatments.' },
    { name: 'World History', slug: 'world-history', icon: 'i-lucide-globe', description: 'Global events and historical figures.' },
    { name: 'US History', slug: 'us-history', icon: 'i-lucide-flag', description: 'Events and figures in US history.' },
    { name: 'Geography', slug: 'geography', icon: 'i-lucide-map', description: 'Countries, capitals, and natural landmarks.' },
    { name: 'Languages', slug: 'languages', icon: 'i-lucide-languages', description: 'Learn to speak new languages.' },
    { name: 'Linguistics', slug: 'linguistics', icon: 'i-lucide-message-square', description: 'The study of language and its structure.' },
    { name: 'Literature', slug: 'literature', icon: 'i-lucide-book-open', description: 'Classic books, authors, and poetry.' },
    { name: 'Philosophy', slug: 'philosophy', icon: 'i-lucide-brain', description: 'Ethics, logic, and existentialism.' },
    { name: 'Psychology', slug: 'psychology', icon: 'i-lucide-user', description: 'Mind, behavior, and cognitive processes.' },
    { name: 'Sociology', slug: 'sociology', icon: 'i-lucide-users', description: 'Society, social behavior, and culture.' },
    { name: 'Economics', slug: 'economics', icon: 'i-lucide-trending-up', description: 'Micro/macro economics and finance.' },
    { name: 'Business', slug: 'business', icon: 'i-lucide-briefcase', description: 'Management, marketing, and entrepreneurship.' },
    { name: 'Law', slug: 'law', icon: 'i-lucide-scale', description: 'Legal systems, constitutional law, and rights.' },
    { name: 'Political Science', slug: 'political-science', icon: 'i-lucide-landmark', description: 'Government systems and political theory.' },
    { name: 'Art History', slug: 'art-history', icon: 'i-lucide-palette', description: 'Famous artworks, movements, and artists.' },
    { name: 'Music Theory', slug: 'music-theory', icon: 'i-lucide-music', description: 'Scales, chords, and musical structure.' },
    { name: 'Engineering', slug: 'engineering', icon: 'i-lucide-wrench', description: 'Civil, mechanical, and electrical engineering.' },
    { name: 'Astronomy', slug: 'astronomy', icon: 'i-lucide-moon', description: 'Stars, planets, and the universe.' },
    { name: 'Environmental Science', slug: 'environmental-science', icon: 'i-lucide-leaf', description: 'Ecology, climate, and conservation.' },
    { name: 'Nutrition', slug: 'nutrition', icon: 'i-lucide-apple', description: 'Diet, vitamins, and healthy eating.' },
    { name: 'Cooking', slug: 'cooking', icon: 'i-lucide-chef-hat', description: 'Culinary arts, techniques, and recipes.' },
    { name: 'Automotive', slug: 'automotive', icon: 'i-lucide-car', description: 'Car mechanics, maintenance, and history.' },
    { name: 'Aviation', slug: 'aviation', icon: 'i-lucide-plane', description: 'Flight principles, aircraft, and regulations.' },
    { name: 'Real Estate', slug: 'real-estate', icon: 'i-lucide-home', description: 'Property, mortgages, and investing.' },
    { name: 'Pop Culture', slug: 'pop-culture', icon: 'i-lucide-tv', description: 'Movies, music, and entertainment trivia.' }
]

function generateDeckBatch(categoryName: string, categoryId: string, batchIndex: number, startIndex: number): string[] {
    const lines: string[] = []

    for (let d = 0; d < 10; d++) {
        const deckId = uuidv4()
        const deckIndex = startIndex + d + 1
        const deckName = `${categoryName} Mastery Vol ${deckIndex}`
        const desc = `An essential study guide covering the core concepts of ${categoryName}.`

        lines.push(
            `INSERT INTO decks (id, user_id, category_id, name, description, created_at) VALUES ('${deckId}', NULL, '${categoryId}', '${deckName.replace(/'/g, "''")}', '${desc.replace(/'/g, "''")}', '${now}');`,
        )

        // Generate ~5 cards per deck to keep file size reasonable
        for (let c = 0; c < 5; c++) {
            const cardId = uuidv4()
            const front = `Concept ${c + 1} from ${categoryName}?`
            const back = `This is the definition and explanation of concept ${c + 1} for ${categoryName}.`

            lines.push(
                `INSERT INTO cards (id, deck_id, front, back, created_at) VALUES ('${cardId}', '${deckId}', '${front.replace(/'/g, "''")}', '${back.replace(/'/g, "''")}', '${now}');`,
            )
        }
    }

    return lines
}

async function main() {
    const isProd = process.argv.includes('--remote')

    mkdirSync(DRIZZLE_DIR, { recursive: true })
    const seedPath = resolve(DRIZZLE_DIR, 'seed-massive.sql')

    console.log(`🌱 Generating MASSIVE seed payload...`)

    const lines: string[] = ['-- Massive Seed: Categories, Decks, and Cards']

    lines.push('DELETE FROM categories;')
    lines.push('DELETE FROM decks WHERE user_id IS NULL;')
    lines.push('DELETE FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE user_id IS NULL);')

    for (const cat of categories) {
        const catId = uuidv4()
        lines.push(
            `INSERT INTO categories (id, name, slug, icon, description, created_at) VALUES ('${catId}', '${cat.name.replace(/'/g, "''")}', '${cat.slug}', '${cat.icon}', '${cat.description.replace(/'/g, "''")}', '${now}');`
        )

        const deckLines = generateDeckBatch(cat.name, catId, 0, 0)
        lines.push(...deckLines)
    }

    writeFileSync(seedPath, lines.join('\n'), 'utf8')

    console.log(`Running seed script (${isProd ? 'REMOTE' : 'LOCAL'})...`)
    runWrangler(seedPath, !isProd)
    console.log('   ✅ Categories and 300 Decks seeded.\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
