import type { Card } from '../types/flashcard'

export function useDeckCards(deckId: MaybeRefOrGetter<string | undefined>) {
  const id = computed(() => toValue(deckId))
  const { data: cards, pending, error, refresh } = useFetch<Card[]>(
    () => (id.value ? `/api/decks/${id.value}/cards` : ''),
    {
      default: () => [],
      watch: [id],
    },
  )
  return { cards, pending, error, refresh }
}
