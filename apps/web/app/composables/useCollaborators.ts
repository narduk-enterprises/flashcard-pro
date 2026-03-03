export interface CollaboratorUser {
  id: string
  userId: string
  email: string
  name: string | null
  createdAt: string
}

export function useCollaborators(deckId: MaybeRefOrGetter<string>) {
  const id = computed(() => toValue(deckId))
  const { data: collaborators, pending, error, refresh } = useFetch<CollaboratorUser[]>(
    () => `/api/decks/${id.value}/collaborators`,
    { default: () => [] },
  )

  async function addCollaborator(email: string): Promise<void> {
    await $fetch(`/api/decks/${id.value}/collaborators`, {
      method: 'POST',
      body: { email },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    await refresh()
  }

  return { collaborators, pending, error, refresh, addCollaborator }
}
