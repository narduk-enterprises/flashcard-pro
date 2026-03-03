import type { Deck } from '../types/flashcard'

export function useDeck(deckId: MaybeRefOrGetter<string | undefined>) {
  const id = computed(() => toValue(deckId))
  const { data: deck, pending, error, refresh } = useFetch<Deck>(
    () => (id.value ? `/api/decks/${id.value}` : ''),
    {
      watch: [id],
    },
  )
  return { deck, pending, error, refresh }
}
