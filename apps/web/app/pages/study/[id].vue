<script setup lang="ts">
import type { Card } from '../../types/flashcard'

const route = useRoute()
const deckId = computed(() => route.params.id as string)

useSeo({
  title: 'Study — FlashCardPro',
  description: 'Study this deck with spaced repetition.',
})
useWebPageSchema({
  name: 'Study — FlashCardPro',
  description: 'Study this deck with spaced repetition.',
})

const { decks } = useDecks()
const { cards, pending, refresh } = useDeckCards(deckId)
const { render: renderMarkdown } = useMarkdown()
const { submitReview } = useSubmitReview()

const deck = computed(() => decks.value?.find(d => d.id === deckId.value) ?? null)
const shuffled = ref(false)
const shuffledCards = ref<Card[]>([])
const cardList = computed(() => {
  if (shuffled.value && shuffledCards.value.length) return shuffledCards.value
  return (cards.value ?? []) as Card[]
})
const reverseMode = ref(false)
const currentIndex = ref(0)
const flipped = ref(false)
const ratingInProgress = ref(false)
const sessionComplete = ref(false)
const sessionStats = reactive({ again: 0, hard: 0, good: 0, easy: 0 })

const currentCard = computed(() => {
  const list = cardList.value
  const i = currentIndex.value
  return i >= 0 && i < list.length ? list[i]! : null
})

const progressLabel = computed(() => {
  const total = cardList.value.length
  if (total === 0) return 'No cards'
  const i = currentIndex.value + 1
  return `${Math.min(i, total)} / ${total}`
})

const progressPercent = computed(() => {
  const total = cardList.value.length
  if (total === 0) return 0
  return Math.round(((currentIndex.value) / total) * 100)
})

const sessionTotal = computed(() => sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy)

const canRate = computed(() => flipped.value && currentCard.value && !ratingInProgress.value)

function flip() {
  flipped.value = !flipped.value
}

async function rate(r: number) {
  if (!currentCard.value || ratingInProgress.value) return
  ratingInProgress.value = true
  try {
    await submitReview({ cardId: currentCard.value.id, rating: r })
    if (r === 1) sessionStats.again++
    else if (r === 2) sessionStats.hard++
    else if (r === 3) sessionStats.good++
    else if (r === 4) sessionStats.easy++
    flipped.value = false
    if (currentIndex.value < cardList.value.length - 1) {
      currentIndex.value++
    } else {
      sessionComplete.value = true
    }
  } finally {
    ratingInProgress.value = false
  }
}

function toggleShuffle() {
  shuffled.value = !shuffled.value
  if (shuffled.value) {
    const arr = [...(cards.value ?? []) as Card[]]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!]
    }
    shuffledCards.value = arr
  }
  currentIndex.value = 0
  flipped.value = false
}

function toggleReverse() {
  reverseMode.value = !reverseMode.value
}

const displayFront = computed(() => {
  if (!currentCard.value) return ''
  return reverseMode.value ? currentCard.value.back : currentCard.value.front
})

const displayBack = computed(() => {
  if (!currentCard.value) return ''
  return reverseMode.value ? currentCard.value.front : currentCard.value.back
})

function restartSession() {
  sessionComplete.value = false
  sessionStats.again = 0
  sessionStats.hard = 0
  sessionStats.good = 0
  sessionStats.easy = 0
  currentIndex.value = 0
  flipped.value = false
  refresh()
}

function onStudyKeydown(event: KeyboardEvent) {
  if (sessionComplete.value) return
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    flip()
  } else if (canRate.value && event.key === '1') {
    rate(1)
  } else if (canRate.value && event.key === '2') {
    rate(2)
  } else if (canRate.value && event.key === '3') {
    rate(3)
  } else if (canRate.value && event.key === '4') {
    rate(4)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onStudyKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onStudyKeydown)
})
</script>

<template>
  <UPage>
    <UPageHeader
      :title="deck?.name ?? 'Study'"
      :description="progressLabel"
    >
      <template #links>
        <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
          Exit
        </UButton>
        <UButton v-if="deck" :to="`/decks/${deck.id}`" variant="ghost" color="neutral" icon="i-lucide-settings">
          Manage deck
        </UButton>
        <UButton
          variant="ghost"
          :color="shuffled ? 'primary' : 'neutral'"
          icon="i-lucide-shuffle"
          @click="toggleShuffle"
        >
          Shuffle
        </UButton>
        <UButton
          variant="ghost"
          :color="reverseMode ? 'primary' : 'neutral'"
          icon="i-lucide-repeat"
          @click="toggleReverse"
        >
          Reverse
        </UButton>
      </template>
    </UPageHeader>

    <div v-if="!deck && !pending" class="rounded-lg border border-default bg-muted p-4">
      <p class="text-muted">Deck not found.</p>
      <UButton to="/" class="mt-2">Back to dashboard</UButton>
    </div>

    <div v-else-if="pending && !cardList.length" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!cardList.length" class="rounded-xl border border-default bg-default p-8 text-center shadow-card">
      <p class="text-default-muted">No cards in this deck. Add cards in Manage.</p>
      <UButton v-if="deck" :to="`/decks/${deck.id}`" class="mt-4">Manage deck</UButton>
    </div>

    <!-- Session Summary -->
    <div v-else-if="sessionComplete" class="mx-auto max-w-2xl">
      <div class="card-base p-8 text-center">
        <UIcon name="i-lucide-trophy" class="mx-auto mb-4 size-12 text-primary" />
        <h2 class="font-display text-2xl font-bold text-default">Session Complete!</h2>
        <p class="mt-2 text-default-muted">
          You reviewed {{ sessionTotal }} card{{ sessionTotal === 1 ? '' : 's' }} in this session.
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-default bg-muted p-3">
            <p class="text-2xl font-bold text-default">{{ sessionStats.again }}</p>
            <p class="text-xs text-default-muted">Again</p>
          </div>
          <div class="rounded-xl border border-default bg-muted p-3">
            <p class="text-2xl font-bold text-default">{{ sessionStats.hard }}</p>
            <p class="text-xs text-default-muted">Hard</p>
          </div>
          <div class="rounded-xl border border-default bg-muted p-3">
            <p class="text-2xl font-bold text-default">{{ sessionStats.good }}</p>
            <p class="text-xs text-default-muted">Good</p>
          </div>
          <div class="rounded-xl border border-default bg-muted p-3">
            <p class="text-2xl font-bold text-default">{{ sessionStats.easy }}</p>
            <p class="text-xs text-default-muted">Easy</p>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <UButton icon="i-lucide-rotate-ccw" color="primary" @click="restartSession">
            Study again
          </UButton>
          <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-home">
            Dashboard
          </UButton>
        </div>
      </div>
    </div>

    <!-- Study Cards -->
    <div v-else class="mx-auto max-w-2xl">
      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <div
        class="card-base focus-glow cursor-pointer select-none overflow-hidden transition-base hover:shadow-overlay"
        style="min-height: 14rem; perspective: 1000px;"
        @click="flip"
      >
        <div
          class="relative min-h-52 w-full transition-transform duration-300"
          style="transform-style: preserve-3d;"
          :style="{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
          <div
            class="absolute inset-0 flex flex-col justify-center p-6"
            style="backface-visibility: hidden;"
          >
            <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
            <p v-if="currentCard" class="text-default text-lg" v-html="renderMarkdown(displayFront)" />
            <p class="text-default-muted mt-2 text-center text-sm">
              Press <UKbd value="Space" class="mx-0.5" /> to flip
            </p>
          </div>
          <div
            class="absolute inset-0 flex flex-col justify-center p-6"
            style="backface-visibility: hidden; transform: rotateY(180deg);"
          >
            <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
            <p v-if="currentCard" class="text-default text-lg" v-html="renderMarkdown(displayBack)" />
            <p class="text-default-muted mt-2 text-center text-sm">
              Press <UKbd value="Space" class="mx-0.5" /> to flip back
            </p>
          </div>
        </div>
      </div>

      <div v-if="canRate" class="mt-6 flex flex-wrap justify-center gap-2">
        <UButton
          color="error"
          variant="soft"
          size="lg"
          @click="rate(1)"
        >
          Again <UKbd value="1" class="ml-1" />
        </UButton>
        <UButton
          color="warning"
          variant="soft"
          size="lg"
          @click="rate(2)"
        >
          Hard <UKbd value="2" class="ml-1" />
        </UButton>
        <UButton
          color="primary"
          variant="soft"
          size="lg"
          @click="rate(3)"
        >
          Good <UKbd value="3" class="ml-1" />
        </UButton>
        <UButton
          color="success"
          variant="soft"
          size="lg"
          @click="rate(4)"
        >
          Easy <UKbd value="4" class="ml-1" />
        </UButton>
      </div>
    </div>
  </UPage>
</template>
