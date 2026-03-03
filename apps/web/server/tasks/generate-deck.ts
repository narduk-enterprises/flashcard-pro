import { categories, decks, cards } from '../database/schema'
import { v4 as uuidv4 } from 'uuid'

// In a real production environment, you might want to create a dedicated system user
// For now, we'll leave user_id as NULL to signify a public/system-generated deck,
// matching the discovery and seeding behavior.

export default defineTask({
    meta: {
        name: 'generate-deck',
        description: 'Generates a new flashcard deck every 4 hours using Cloudflare AI',
    },
    async run({ context }) {
        console.log('[Task: generate-deck] Starting AI deck generation...')

        // Access Cloudflare AI binding and DB from the event context
        // @ts-expect-error - environment bindings
        const ai = globalThis.__env__?.AI || process.env.AI
        if (!ai) {
            console.error('[Task: generate-deck] Cloudflare AI binding not found.')
            return { result: 'fail', error: 'AI binding missing' }
        }

        // We construct a mock event to pass to useDatabase for tasks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockEvent = { context } as any
        const db = useDatabase(mockEvent)

        try {
            // 1. Fetch available categories to pick one randomly
            const allCategories = await db.select().from(categories).all()
            if (!allCategories.length) {
                console.warn('[Task: generate-deck] No categories found in DB. Skipping.')
                return { result: 'skipped', reason: 'no_categories' }
            }

            const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)]
            if (!randomCategory) {
                console.warn('[Task: generate-deck] Failed to select a random category.')
                return { result: 'skipped', reason: 'category_selection_failed' }
            }
            console.log(`[Task: generate-deck] Selected Category: ${randomCategory.name}`)

            // 2. Formulate the prompt for the Llama model
            const systemPrompt = `You are an expert educational content creator. Your task is to generate a high-quality flashcard deck for the category "${randomCategory.name}".
Choose a specific and interesting sub-topic within this category. 
You MUST respond with purely valid JSON. Do NOT include markdown code blocks or any conversational text.

The JSON schema must exactly match:
{
  "deckName": "string, a catchy and descriptive title",
  "deckDescription": "string, a 1-2 sentence description",
  "tags": "string, 3 comma-separated keywords",
  "cards": [
    { "front": "string, the question or prompt", "back": "string, the concise answer" }
  ]
}
Generate exactly 7-10 high-quality cards.`

            // 3. Call Cloudflare AI models (Llama 3 8B Instruct)
            // Note: adjust the model string to whatever the active/latest supported Meta model is in CF natively
            const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a new deck for the category: ${randomCategory.name}` }
                ]
            })

            // 4. Parse the AI response
            const rawText = response.response || response

            // Clean up the text in case the LLM returned markdown blocks despite instructions
            const cleanedText = rawText.replaceAll('```json', '').replaceAll('```', '').trim()
            const aiDeck = JSON.parse(cleanedText)

            // 5. Insert into Database
            const deckId = uuidv4()
            const now = new Date().toISOString()

            // Insert Deck
            await db.insert(decks).values({
                id: deckId,
                categoryId: randomCategory.id,
                name: aiDeck.deckName,
                description: aiDeck.deckDescription,
                tags: aiDeck.tags,
                isPublic: true,
                createdAt: now,
            })

            // Insert Cards
            const cardInserts = aiDeck.cards.map((c: { front: string; back: string }) => ({
                id: uuidv4(),
                deckId: deckId,
                front: c.front,
                back: c.back,
                createdAt: now
            }))

            if (cardInserts.length > 0) {
                await db.insert(cards).values(cardInserts)
            }

            console.log(`[Task: generate-deck] Successfully generated and inserted deck: "${aiDeck.deckName}" with ${cardInserts.length} cards.`)

            return { result: 'success', deckId, deckName: aiDeck.deckName, cardCount: cardInserts.length }

        } catch (error) {
            console.error('[Task: generate-deck] Generation failed:', error)
            return { result: 'fail', error: String(error) }
        }
    }
})
