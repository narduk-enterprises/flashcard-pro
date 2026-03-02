import type { Deck } from '../types/flashcard'

export function useDecks() {
  const { data: decks, pending, error, refresh } = useFetch<Deck[]>('/api/decks', {
    default: () => [],
  })
  return { decks, pending, error, refresh }
}
