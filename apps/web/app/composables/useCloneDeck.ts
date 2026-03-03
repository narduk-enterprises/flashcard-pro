import type { Deck } from '../types/flashcard'

export function useCloneDeck() {
  async function cloneDeck(deckId: string): Promise<Deck> {
    const data = await $fetch<Deck>('/api/decks/clone', {
      method: 'POST',
      body: { deckId },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    return data
  }
  return { cloneDeck }
}
