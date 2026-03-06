<script setup lang="ts">
useSeo({
  title: 'FlashCardPro — Free Flashcard & Spaced Repetition App',
  description: 'Create, study, and share flashcard decks with intelligent spaced repetition. Track your progress, collaborate with others, and master any subject — completely free.',
  keywords: ['flashcards', 'spaced repetition', 'study app', 'learning', 'free flashcard app', 'study tools', 'flashcard maker'],
  ogImage: { title: 'FlashCardPro', description: 'Free flashcard & spaced repetition app.', icon: '📇' },
})
useWebPageSchema({
  name: 'FlashCardPro — Free Flashcard & Spaced Repetition App',
  description: 'Create, study, and share flashcard decks with intelligent spaced repetition.',
})
useFAQSchema([
  { question: 'What is FlashCardPro?', answer: 'FlashCardPro is a free flashcard application that uses spaced repetition to help you memorize anything efficiently. Create decks, add cards, and study with smart scheduling.' },
  { question: 'Is FlashCardPro free?', answer: 'Yes, FlashCardPro is completely free to use. Create unlimited decks, add unlimited cards, and study as much as you want.' },
  { question: 'What is spaced repetition?', answer: 'Spaced repetition is a learning technique where you review material at increasing intervals. Cards you know well are shown less often, while difficult cards appear more frequently.' },
  { question: 'Can I share my flashcard decks?', answer: 'Yes! You can make your decks public so others can discover and study them. You can also clone public decks created by other users.' },
])
useSchemaOrg([{
  '@type': 'SoftwareApplication',
  'name': 'FlashCardPro',
  'applicationCategory': 'EducationalApplication',
  'operatingSystem': 'Web',
  'offers': { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  'description': 'Create, study, and share flashcard decks with intelligent spaced repetition.',
}])

const { decks, pending, error } = useDecks()
const { isAuthenticated: isLoggedIn, user } = useAuth()
const { stats } = useStudyStats()
const { isFavorited } = useFavorites()

// Feature 1: Personalized greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

// Feature 3: Deck sorting
const sortBy = ref<'name' | 'date' | 'cards'>('date')
const sortedDecks = computed(() => {
  if (!decks.value) return []
  const copy = [...decks.value]
  if (sortBy.value === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'cards') {
    copy.sort((a, b) => (b.cardCount ?? 0) - (a.cardCount ?? 0))
  } else {
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  return copy
})

// Feature 4: Favorites section
const favoritedDecks = computed(() => {
  if (!decks.value) return []
  return decks.value.filter(d => isFavorited(d.id))
})

// Feature 2: Quick study random deck
function studyRandomDeck() {
  if (!decks.value?.length) return
  const withCards = decks.value.filter(d => (d.cardCount ?? 0) > 0)
  if (!withCards.length) return
  const randomDeck = withCards[Math.floor(Math.random() * withCards.length)]!
  navigateTo(`/study/${randomDeck.id}`)
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="isLoggedIn && user ? `${greeting}, ${user.name || user.email}` : 'Your Decks'"
      description="Study or manage your flashcard decks."
    >
      <template #links>
        <UButton to="/discover" variant="ghost" color="neutral" icon="i-lucide-compass">
          Discover
        </UButton>
        <!-- Feature 2: Quick study random -->
        <UButton
          v-if="decks?.length"
          variant="ghost"
          color="neutral"
          icon="i-lucide-shuffle"
          @click="studyRandomDeck"
        >
          Study random
        </UButton>
        <UButton to="/decks/new" icon="i-lucide-plus" color="primary">
          New deck
        </UButton>
      </template>
    </UPageHeader>

    <!-- Study Statistics -->
    <div v-if="isLoggedIn && stats && stats.totalReviews > 0" class="mb-8 grid gap-4 sm:grid-cols-4">
      <div class="card-base stat-accent p-4 text-center">
        <UIcon name="i-lucide-layers" class="mx-auto mb-2 size-5 text-primary" />
        <p class="text-2xl font-bold text-default">{{ stats.totalDecks }}</p>
        <p class="text-xs text-default-muted">Decks</p>
      </div>
      <div class="card-base stat-accent p-4 text-center">
        <UIcon name="i-lucide-square-stack" class="mx-auto mb-2 size-5 text-primary" />
        <p class="text-2xl font-bold text-default">{{ stats.totalCards }}</p>
        <p class="text-xs text-default-muted">Cards</p>
      </div>
      <div class="card-base stat-accent p-4 text-center">
        <UIcon name="i-lucide-repeat" class="mx-auto mb-2 size-5 text-success" />
        <p class="text-2xl font-bold text-default">{{ stats.totalReviews }}</p>
        <p class="text-xs text-default-muted">Reviews</p>
      </div>
      <div class="card-base stat-accent p-4 text-center">
        <UIcon name="i-lucide-star" class="mx-auto mb-2 size-5 text-warning" />
        <p class="text-2xl font-bold text-default">{{ stats.averageRating }}</p>
        <p class="text-xs text-default-muted">Avg Rating</p>
      </div>
    </div>

    <div v-if="error" class="rounded-lg border border-default bg-muted p-4">
      <p class="text-muted">Failed to load decks. Check the console and try again.</p>
    </div>

    <div v-else-if="pending && !decks?.length" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!decks?.length" class="relative overflow-hidden rounded-xl border border-default bg-default p-10 text-center shadow-card">
      <div class="absolute inset-0 opacity-10" style="background: radial-gradient(ellipse at center, rgb(139 92 246 / 0.5), transparent 70%);" aria-hidden="true" />
      <div class="relative">
        <UIcon name="i-lucide-book-open" class="mx-auto mb-4 size-12 text-primary/50" />
        <p class="text-default-muted mb-1 text-lg font-medium">No decks yet</p>
        <p class="text-default-muted mb-6 text-sm">Create your first flashcard deck to start studying.</p>
        <UButton to="/decks/new" icon="i-lucide-plus" color="primary" size="lg">
          Create your first deck
        </UButton>
      </div>
    </div>

    <template v-else>
      <!-- Feature 4: Favorites section -->
      <div v-if="favoritedDecks.length" class="mb-8">
        <h3 class="mb-3 flex items-center gap-2 font-display font-semibold text-default">
          <UIcon name="i-lucide-heart" class="size-5 text-primary" />
          Favorites
        </h3>
        <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="(deck, i) in favoritedDecks"
            :key="deck.id"
            class="card-base flex flex-col gap-3 p-4 transition-base animate-count-in border-l-4 border-l-primary"
            :style="{ animationDelay: `${i * 60}ms` }"
          >
            <div class="min-h-0 flex-1">
              <h3 class="font-display font-semibold text-default">{{ deck.name }}</h3>
              <p class="mt-1 text-xs text-default-muted">
                {{ deck.cardCount ?? 0 }} card{{ (deck.cardCount ?? 0) === 1 ? '' : 's' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton :to="`/study/${deck.id}`" size="sm" icon="i-lucide-play" color="primary" variant="soft">
                Study now
              </UButton>
              <UButton :to="`/decks/${deck.id}`" size="sm" icon="i-lucide-settings" color="neutral" variant="soft">
                Manage
              </UButton>
            </div>
          </li>
        </ul>
      </div>

      <!-- Feature 3: Sort controls -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-display font-semibold text-default">All Decks</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-default-muted">Sort:</span>
          <UButton
            size="xs"
            :variant="sortBy === 'date' ? 'soft' : 'ghost'"
            :color="sortBy === 'date' ? 'primary' : 'neutral'"
            @click="sortBy = 'date'"
          >
            Newest
          </UButton>
          <UButton
            size="xs"
            :variant="sortBy === 'name' ? 'soft' : 'ghost'"
            :color="sortBy === 'name' ? 'primary' : 'neutral'"
            @click="sortBy = 'name'"
          >
            Name
          </UButton>
          <UButton
            size="xs"
            :variant="sortBy === 'cards' ? 'soft' : 'ghost'"
            :color="sortBy === 'cards' ? 'primary' : 'neutral'"
            @click="sortBy = 'cards'"
          >
            Cards
          </UButton>
        </div>
      </div>

      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="(deck, i) in sortedDecks"
          :key="deck.id"
          class="card-base gradient-border flex flex-col gap-3 p-5 animate-count-in"
          :style="{ animationDelay: `${i * 60}ms` }"
        >
          <div class="min-h-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-display font-semibold text-default">
                {{ deck.name }}
              </h3>
              <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                <UIcon name="i-lucide-square-stack" class="size-3" />
                {{ deck.cardCount ?? 0 }}
              </span>
            </div>
            <p v-if="deck.description" class="mt-1.5 line-clamp-2 text-sm text-default-muted">
              {{ deck.description }}
            </p>
            <div v-if="deck.tags" class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="tag in deck.tags.split(',').map(t => t.trim()).filter(Boolean)"
                :key="tag"
                class="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-default-muted"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <UButton
              :to="`/study/${deck.id}`"
              size="sm"
              icon="i-lucide-play"
              color="primary"
              variant="soft"
            >
              Study now
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
          </div>
        </li>
      </ul>
    </template>
  </UPage>
</template>
