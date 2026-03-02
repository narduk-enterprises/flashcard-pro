import type { Card } from '../types/flashcard'

export function useAddCard(deckId: MaybeRefOrGetter<string>) {
  async function addCard(body: { front: string; back: string }): Promise<Card> {
    const id = toValue(deckId)
    const data = await $fetch<Card>(`/api/decks/${id}/cards`, {
      method: 'POST',
      body: { front: body.front.trim(), back: body.back.trim() },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    return data
  }
  return { addCard }
}
