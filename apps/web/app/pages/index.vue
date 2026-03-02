<script setup lang="ts">
useSeo({
  title: 'FlashCardPro — Dashboard',
  description: 'Your decks and spaced repetition practice.',
  ogImage: { title: 'FlashCardPro', description: 'Spaced repetition flashcards.', icon: '📇' },
})
useWebPageSchema({
  name: 'FlashCardPro Dashboard',
  description: 'Your decks and spaced repetition practice.',
})

const { decks, pending, error } = useDecks()
</script>

<template>
  <UPage>
    <UPageHeader
      title="Your Decks"
      description="Study or manage your flashcard decks."
    >
      <template #links>
        <UButton to="/discover" variant="ghost" color="neutral" icon="i-lucide-compass">
          Discover
        </UButton>
        <UButton to="/decks/new" icon="i-lucide-plus" color="primary">
          New deck
        </UButton>
      </template>
    </UPageHeader>

    <div v-if="error" class="rounded-lg border border-default bg-muted p-4">
      <p class="text-muted">Failed to load decks. Check the console and try again.</p>
    </div>

    <div v-else-if="pending && !decks?.length" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!decks?.length" class="rounded-xl border border-default bg-default p-8 text-center shadow-card">
      <p class="text-default-muted mb-4">No decks yet.</p>
      <UButton to="/decks/new" icon="i-lucide-plus" color="primary">
        Create your first deck
      </UButton>
    </div>

    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="(deck, i) in decks"
        :key="deck.id"
        class="card-base flex flex-col gap-3 p-4 transition-base animate-count-in"
        :style="{ animationDelay: `${i * 60}ms` }"
      >
        <div class="min-h-0 flex-1">
          <h3 class="font-display font-semibold text-default">
            {{ deck.name }}
          </h3>
          <p v-if="deck.description" class="mt-1 line-clamp-2 text-sm text-default-muted">
            {{ deck.description }}
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
  </UPage>
</template>
