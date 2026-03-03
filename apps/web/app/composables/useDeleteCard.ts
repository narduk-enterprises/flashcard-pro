export function useDeleteCard() {
  async function deleteCard(cardId: string): Promise<void> {
    await $fetch(`/api/cards/${cardId}`, {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
  }
  return { deleteCard }
}
