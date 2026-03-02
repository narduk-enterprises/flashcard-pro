import type { Deck } from '../types/flashcard'

export function useDiscoverDecks(query: MaybeRefOrGetter<string>) {
  const q = computed(() => toValue(query))
  const { data: decks, pending, error, refresh } = useFetch<Deck[]>(
    () => (q.value ? `/api/decks?q=${encodeURIComponent(q.value)}` : '/api/decks'),
    { default: () => [] },
  )
  return { decks, pending, error, refresh }
}
