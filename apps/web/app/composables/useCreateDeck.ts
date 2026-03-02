import type { Deck } from '../types/flashcard'

export function useCreateDeck() {
  async function createDeck(body: { name: string; description?: string }): Promise<Deck> {
    const data = await $fetch<Deck>('/api/decks', {
      method: 'POST',
      body: { name: body.name.trim(), description: (body.description ?? '').trim() },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    return data
  }
  return { createDeck }
}
