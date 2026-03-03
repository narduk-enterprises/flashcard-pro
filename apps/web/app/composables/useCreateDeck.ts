import type { Deck } from '../types/flashcard'

export function useCreateDeck() {
  async function createDeck(body: { name: string; description?: string; tags?: string; isPublic?: boolean }): Promise<Deck> {
    const data = await $fetch<Deck>('/api/decks', {
      method: 'POST',
      body: {
        name: body.name.trim(),
        description: (body.description ?? '').trim(),
        tags: (body.tags ?? '').trim(),
        isPublic: body.isPublic ?? true,
      },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    return data
  }
  return { createDeck }
}
