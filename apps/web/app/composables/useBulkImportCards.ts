export function useBulkImportCards(deckId: MaybeRefOrGetter<string>) {
  async function bulkImport(cardData: Array<{ front: string; back: string }>): Promise<{ imported: number }> {
    const id = toValue(deckId)
    const data = await $fetch<{ imported: number }>(`/api/decks/${id}/import`, {
      method: 'POST',
      body: { cards: cardData },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    return data
  }
  return { bulkImport }
}
