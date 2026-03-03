export interface FavoriteItem {
  id: string
  deckId: string
  createdAt: string
  deckName: string
  deckDescription: string
}

export function useFavorites() {
  const { data: favorites, pending, error, refresh } = useFetch<FavoriteItem[]>('/api/favorites', {
    default: () => [],
  })

  async function addFavorite(deckId: string) {
    await $fetch('/api/favorites', {
      method: 'POST',
      body: { deckId },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    await refresh()
  }

  async function removeFavorite(deckId: string) {
    await $fetch('/api/favorites/remove', {
      method: 'POST',
      body: { deckId },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    await refresh()
  }

  function isFavorited(deckId: string) {
    return (favorites.value ?? []).some(f => f.deckId === deckId)
  }

  return { favorites, pending, error, refresh, addFavorite, removeFavorite, isFavorited }
}
