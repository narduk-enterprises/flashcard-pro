<script setup lang="ts">
useSeo({
  title: 'Discover decks — FlashCardPro',
  description: 'Find flashcard decks to study. Browse or search by name and description.',
  ogImage: { title: 'Discover decks', description: 'Find decks to study.', icon: '🔍' },
})
useWebPageSchema({
  name: 'Discover decks — FlashCardPro',
  description: 'Find flashcard decks to study.',
})

const search = ref('')
const { decks, pending, error } = useDiscoverDecks(search)
const { isLoggedIn } = useAuth()
const { cloneDeck } = useCloneDeck()
const cloningDeckId = ref<string | null>(null)

async function handleClone(deckId: string) {
  cloningDeckId.value = deckId
  try {
    const cloned = await cloneDeck(deckId)
    await navigateTo(`/decks/${cloned.id}`)
  } finally {
    cloningDeckId.value = null
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Discover decks"
      description="Find decks to study. Search by name or description."
    >
      <template #links>
        <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
          Dashboard
        </UButton>
      </template>
    </UPageHeader>

    <div class="mb-6">
      <UInput
        v-model="search"
        placeholder="Search decks..."
        size="lg"
        icon="i-lucide-search"
        class="max-w-md"
      />
    </div>

    <div v-if="error" class="rounded-lg border border-default bg-muted p-4">
      <p class="text-muted">Failed to load decks. Try again.</p>
    </div>

    <div v-else-if="pending && !decks?.length" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!decks?.length" class="rounded-xl border border-default bg-default p-8 text-center shadow-card">
      <p class="text-default-muted">
        {{ search ? 'No decks match your search.' : 'No decks yet. Create one to get started.' }}
      </p>
      <UButton v-if="!search" to="/decks/new" icon="i-lucide-plus" color="primary" class="mt-4">
        Create a deck
      </UButton>
    </div>

    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="(deck, i) in decks"
        :key="deck.id"
        class="card-base flex flex-col gap-3 p-4 transition-base animate-count-in"
        :style="{ animationDelay: `${i * 50}ms` }"
      >
        <div class="min-h-0 flex-1">
          <h3 class="font-display font-semibold text-default">
            {{ deck.name }}
          </h3>
          <p v-if="deck.description" class="mt-1 line-clamp-2 text-sm text-default-muted">
            {{ deck.description }}
          </p>
          <p class="mt-1 text-xs text-default-muted">
            {{ deck.cardCount ?? 0 }} card{{ (deck.cardCount ?? 0) === 1 ? '' : 's' }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            :to="`/study/${deck.id}`"
            size="sm"
            icon="i-lucide-play"
            color="primary"
            variant="soft"
          >
            Study
          </UButton>
          <UButton
            :to="`/decks/${deck.id}`"
            size="sm"
            icon="i-lucide-settings"
            color="neutral"
            variant="soft"
          >
            Manage
          </UButton>
          <UButton
            v-if="isLoggedIn"
            size="sm"
            icon="i-lucide-copy"
            color="neutral"
            variant="soft"
            :loading="cloningDeckId === deck.id"
            @click="handleClone(deck.id)"
          >
            Clone
          </UButton>
        </div>
      </li>
    </ul>
  </UPage>
</template>
