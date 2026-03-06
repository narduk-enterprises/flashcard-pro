<script setup lang="ts">
useSeo({
  title: 'Discover Flashcard Decks — FlashCardPro',
  description: 'Browse and search community flashcard decks. Find study materials for any subject — languages, science, history, and more.',
  keywords: ['flashcard decks', 'study materials', 'browse flashcards', 'community decks', 'free study resources'],
  ogImage: { title: 'Discover decks', description: 'Browse community flashcard decks.', icon: '🔍' },
})
useWebPageSchema({
  name: 'Discover Flashcard Decks — FlashCardPro',
  description: 'Browse and search community flashcard decks.',
  type: 'CollectionPage',
})

const search = ref('')
const { decks, pending, error } = useDiscoverDecks(search)
const { isAuthenticated: isLoggedIn } = useAuth()
const { cloneDeck } = useCloneDeck()
const { addFavorite, removeFavorite, isFavorited } = useFavorites()
const cloningDeckId = ref<string | null>(null)

// Feature 16: Tag click filtering
function searchByTag(tag: string) {
  search.value = tag
}

// Feature 17: Discover sort options
const discoverSortBy = ref<'newest' | 'cards'>('newest')
const sortedDiscoverDecks = computed(() => {
  if (!decks.value) return []
  const copy = [...decks.value]
  if (discoverSortBy.value === 'cards') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    copy.sort((a, b: any) => (b.cardCount ?? 0) - (a.cardCount ?? 0))
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    copy.sort((a, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  return copy
})

// Group by category
const decksByCategory = computed(() => {
  const groups: Record<string, typeof sortedDiscoverDecks.value> = {}
  
  for (const deck of sortedDiscoverDecks.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catName = (deck as any).categoryName || 'Uncategorized'
    if (!groups[catName]) {
      groups[catName] = []
    }
    groups[catName].push(deck)
  }
  
  return groups
})

async function handleClone(deckId: string) {
  cloningDeckId.value = deckId
  try {
    const cloned = await cloneDeck(deckId)
    await navigateTo(`/decks/${cloned.id}`)
  } finally {
    cloningDeckId.value = null
  }
}

async function toggleFavorite(deckId: string) {
  if (isFavorited(deckId)) {
    await removeFavorite(deckId)
  } else {
    await addFavorite(deckId)
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

    <div class="mb-6 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        placeholder="     Search decks..."
        size="lg"
        icon="i-lucide-search"
        class="max-w-md w-full sm:w-80"
      >
        <template #leading>
          <UIcon name="i-lucide-search" class="text-muted pointer-events-none" />
        </template>
      </UInput>
      <!-- Feature 17: Sort controls -->
      <div class="flex items-center gap-1">
        <span class="text-xs text-default-muted">Sort:</span>
        <UButton
          size="xs"
          :variant="discoverSortBy === 'newest' ? 'soft' : 'ghost'"
          :color="discoverSortBy === 'newest' ? 'primary' : 'neutral'"
          @click="discoverSortBy = 'newest'"
        >
          Newest
        </UButton>
        <UButton
          size="xs"
          :variant="discoverSortBy === 'cards' ? 'soft' : 'ghost'"
          :color="discoverSortBy === 'cards' ? 'primary' : 'neutral'"
          @click="discoverSortBy = 'cards'"
        >
          Most cards
        </UButton>
      </div>
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

    <div v-else class="space-y-12">
      <div v-for="(categoryDecks, categoryName) in decksByCategory" :key="categoryName" class="space-y-4">
        <div class="flex items-center gap-2 border-b border-default pb-2">
          <UIcon name="i-lucide-folder" class="size-5 text-primary" />
          <h2 class="text-xl font-display font-semibold text-default">{{ categoryName }}</h2>
          <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-default-muted">{{ categoryDecks.length }}</span>
        </div>
        
        <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="(deck, i) in categoryDecks"
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
              <!-- Feature 16: Clickable tags -->
              <div v-if="deck.tags" class="mt-1 flex flex-wrap gap-1">
                <UButton
                  v-for="tag in deck.tags.split(',').map(t => t.trim()).filter(Boolean)"
                  :key="tag"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  class="rounded-full"
                  @click="searchByTag(tag)"
                >
                  {{ tag }}
                </UButton>
              </div>
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
              <UButton
                v-if="isLoggedIn"
                size="sm"
                :icon="isFavorited(deck.id) ? 'i-lucide-heart' : 'i-lucide-heart'"
                :color="isFavorited(deck.id) ? 'primary' : 'neutral'"
                :variant="isFavorited(deck.id) ? 'soft' : 'ghost'"
                @click="toggleFavorite(deck.id)"
              >
                {{ isFavorited(deck.id) ? 'Saved' : 'Save' }}
              </UButton>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </UPage>
</template>
