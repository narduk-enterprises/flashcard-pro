import type { Card } from '../types/flashcard'

export function useEditCard() {
  async function editCard(cardId: string, body: { front: string; back: string }): Promise<Card> {
    const data = await $fetch<Card>(`/api/cards/${cardId}`, {
      method: 'PUT',
      body: { front: body.front.trim(), back: body.back.trim() },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    return data
  }
  return { editCard }
}
