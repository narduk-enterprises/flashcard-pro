<script setup lang="ts">
import type { Card } from '../../types/flashcard'

const route = useRoute()
const deckId = computed(() => route.params.id as string)
const { render: renderMarkdown } = useMarkdown()

useSeo({
  title: 'Manage deck — FlashCardPro',
  description: 'Add and edit cards in this deck.',
})
useWebPageSchema({
  name: 'Manage deck — FlashCardPro',
  description: 'Add and edit cards in this deck.',
})

const { decks } = useDecks()
const { cards, pending, refresh } = useDeckCards(deckId)
const { addCard: addCardMutation } = useAddCard(deckId)

const deck = computed(() => decks.value?.find(d => d.id === deckId.value) ?? null)

const showAddCard = ref(false)
const newFront = ref('')
const newBack = ref('')
const submitting = ref(false)
const addError = ref('')

async function addCard() {
  if (!newFront.value.trim() || !newBack.value.trim()) {
    addError.value = 'Front and back are required.'
    return
  }
  addError.value = ''
  submitting.value = true
  try {
    await addCardMutation({ front: newFront.value, back: newBack.value })
    newFront.value = ''
    newBack.value = ''
    showAddCard.value = false
    await refresh()
  } catch (e: unknown) {
    addError.value = e instanceof Error ? e.message : 'Failed to add card.'
  } finally {
    submitting.value = false
  }
}

function cancelAddCard() {
  showAddCard.value = false
  addError.value = ''
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="deck?.name ?? 'Deck'"
      :description="deck?.description || 'Manage cards'"
    >
      <template #links>
        <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
          Dashboard
        </UButton>
        <UButton
          v-if="deck"
          :to="`/study/${deck.id}`"
          icon="i-lucide-play"
          color="primary"
        >
          Study now
        </UButton>
      </template>
    </UPageHeader>

    <div v-if="!deck && !pending" class="rounded-lg border border-default bg-muted p-4">
      <p class="text-muted">Deck not found.</p>
      <UButton to="/" class="mt-2">Back to dashboard</UButton>
    </div>

    <template v-else-if="deck">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-default-muted text-sm">
          {{ cards?.length ?? 0 }} card{{ (cards?.length ?? 0) === 1 ? '' : 's' }}
        </p>
        <UButton
          v-if="!showAddCard"
          size="sm"
          icon="i-lucide-plus"
          color="primary"
          @click="showAddCard = true"
        >
          Add card
        </UButton>
      </div>

      <div v-if="showAddCard" class="card-base mb-6 space-y-4 p-6">
        <h3 class="font-display font-semibold">New card</h3>
        <UFormField label="Front (Markdown supported)">
          <UTextarea v-model="newFront" placeholder="Question or term" :rows="3" />
        </UFormField>
        <UFormField label="Back (Markdown supported)">
          <UTextarea v-model="newBack" placeholder="Answer or definition" :rows="3" />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton :loading="submitting" color="primary" @click="addCard">
            Add card
          </UButton>
          <UButton variant="ghost" color="neutral" @click="cancelAddCard">
            Cancel
          </UButton>
        </div>
        <p v-if="addError" class="text-sm text-muted">{{ addError }}</p>
      </div>

      <ul v-if="cards?.length" class="space-y-3">
        <li
          v-for="card in (cards as Card[])"
          :key="card.id"
          class="card-base flex flex-col gap-2 p-4 transition-base"
        >
          <div class="grid gap-2 sm:grid-cols-2">
            <div>
              <p class="text-default-muted text-xs font-medium uppercase">Front</p>
              <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown (escapeHtml + limited tags) -->
              <div class="prose prose-sm dark:prose-invert mt-1 max-w-none wrap-break-word" v-html="renderMarkdown(card.front)" />
            </div>
            <div>
              <p class="text-default-muted text-xs font-medium uppercase">Back</p>
              <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown (escapeHtml + limited tags) -->
              <div class="prose prose-sm dark:prose-invert mt-1 max-w-none wrap-break-word" v-html="renderMarkdown(card.back)" />
            </div>
          </div>
        </li>
      </ul>

      <div v-else-if="pending" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <div v-else class="rounded-xl border border-default bg-default p-8 text-center shadow-card">
        <p class="text-default-muted">No cards in this deck yet.</p>
        <UButton
          class="mt-3"
          size="sm"
          icon="i-lucide-plus"
          color="primary"
          @click="showAddCard = true"
        >
          Add first card
        </UButton>
      </div>
    </template>
  </UPage>
</template>
