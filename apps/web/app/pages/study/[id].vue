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
const focusMode = ref(false)
const currentIndex = ref(0)
const flipped = ref(false)
const ratingInProgress = ref(false)
const sessionComplete = ref(false)
const sessionStats = reactive({ again: 0, hard: 0, good: 0, easy: 0 })

// Feature 5: Study Session Timer
const sessionStartTime = ref(0)
const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const mins = Math.floor(elapsedSeconds.value / 60)
  const secs = elapsedSeconds.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function startTimer() {
  sessionStartTime.value = Date.now()
  timerInterval = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - sessionStartTime.value) / 1000)
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// Feature 6: Card Navigation
function goToPreviousCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    flipped.value = false
  }
}

// Feature 7: Score percentage
const scorePercent = computed(() => {
  if (sessionTotal.value === 0) return 0
  const weighted = (sessionStats.easy * 100) + (sessionStats.good * 75) + (sessionStats.hard * 50) + (sessionStats.again * 0)
  return Math.round(weighted / sessionTotal.value)
})

// Feature 8: Missed cards tracking
const missedCardIds = ref<Set<string>>(new Set())

// Feature 9: Keyboard shortcut help
const showShortcuts = ref(false)

const currentCard = computed(() => {
  const list = cardList.value
  const i = currentIndex.value
  return i >= 0 && i < list.length ? list[i]! : null
})

// Feature 10: Card position label
const cardPositionLabel = computed(() => {
  const total = cardList.value.length
  if (total === 0) return ''
  return `Card ${currentIndex.value + 1} of ${total}`
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
    if (r === 1) {
      sessionStats.again++
      missedCardIds.value.add(currentCard.value.id)
    } else if (r === 2) {
      sessionStats.hard++
    } else if (r === 3) {
      sessionStats.good++
    } else if (r === 4) {
      sessionStats.easy++
    }
    flipped.value = false
    if (currentIndex.value < cardList.value.length - 1) {
      currentIndex.value++
    } else {
      sessionComplete.value = true
      stopTimer()
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

function toggleFocusMode() {
  focusMode.value = !focusMode.value
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
  missedCardIds.value.clear()
  elapsedSeconds.value = 0
  startTimer()
  refresh()
}

// Feature 8: Study only missed cards
function studyMissedCards() {
  const allCards = (cards.value ?? []) as Card[]
  const missed = allCards.filter(c => missedCardIds.value.has(c.id))
  if (missed.length === 0) return
  shuffledCards.value = missed
  shuffled.value = true
  sessionComplete.value = false
  sessionStats.again = 0
  sessionStats.hard = 0
  sessionStats.good = 0
  sessionStats.easy = 0
  currentIndex.value = 0
  flipped.value = false
  missedCardIds.value.clear()
  elapsedSeconds.value = 0
  startTimer()
}

function onStudyKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && focusMode.value) {
    focusMode.value = false
    return
  }
  if (event.key === '?' && !sessionComplete.value) {
    showShortcuts.value = !showShortcuts.value
    return
  }
  if (showShortcuts.value) {
    showShortcuts.value = false
    return
  }
  if (sessionComplete.value) return
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    flip()
  } else if (event.key === 'ArrowLeft') {
    goToPreviousCard()
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
  startTimer()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onStudyKeydown)
  stopTimer()
})
</script>

<template>
  <UPage :class="{ 'fixed inset-0 z-[100] bg-default flex flex-col items-center justify-center p-8': focusMode }">
    <UPageHeader
      v-if="!focusMode"
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
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-maximize"
          @click="toggleFocusMode"
        >
          Focus
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
      <!-- Feature 19: Confetti -->
      <div class="confetti-container" aria-hidden="true">
        <div v-for="n in 20" :key="n" class="confetti-piece" :style="{ '--i': n }" />
      </div>
      <div class="card-base p-8 text-center">
        <UIcon name="i-lucide-trophy" class="mx-auto mb-4 size-12 text-primary" />
        <h2 class="font-display text-2xl font-bold text-default">Session Complete!</h2>
        <p class="mt-2 text-default-muted">
          You reviewed {{ sessionTotal }} card{{ sessionTotal === 1 ? '' : 's' }} in this session.
        </p>

        <!-- Feature 7: Score percentage -->
        <div class="mt-4">
          <p class="text-4xl font-bold text-primary">{{ scorePercent }}%</p>
          <p class="text-sm text-default-muted">Performance score</p>
        </div>

        <!-- Feature 5: Session time -->
        <p class="mt-2 text-sm text-default-muted">
          <UIcon name="i-lucide-clock" class="inline size-4" /> Time: {{ formattedTime }}
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
          <!-- Feature 8: Study missed cards only -->
          <UButton
            v-if="missedCardIds.size > 0"
            icon="i-lucide-target"
            color="warning"
            variant="soft"
            @click="studyMissedCards"
          >
            Study missed ({{ missedCardIds.size }})
          </UButton>
          <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-home">
            Dashboard
          </UButton>
        </div>
      </div>
    </div>

    <!-- Study Cards -->
    <div v-else class="mx-auto max-w-2xl">
      <!-- Feature 10: Card position + Feature 5: Timer -->
      <div class="mb-2 flex items-center justify-between text-sm text-default-muted">
        <span>{{ cardPositionLabel }}</span>
        <span><UIcon name="i-lucide-clock" class="inline size-3.5" /> {{ formattedTime }}</span>
      </div>

      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- Feature 6: Previous card button -->
      <div class="mb-2 flex items-center justify-between">
        <UButton
          v-if="currentIndex > 0"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          size="sm"
          @click="goToPreviousCard"
        >
          Previous <UKbd value="←" class="ml-1" />
        </UButton>
        <span v-else />
        <!-- Feature 9: Shortcut help button -->
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-keyboard"
          size="sm"
          @click="showShortcuts = true"
        >
          <UKbd value="?" class="ml-1" />
        </UButton>
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

      <!-- Focus mode exit button -->
      <div v-if="focusMode" class="mt-4 text-center">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-minimize"
          size="sm"
          @click="toggleFocusMode"
        >
          Exit focus mode <UKbd value="Esc" class="ml-1" />
        </UButton>
      </div>
    </div>

    <!-- Feature 9: Keyboard Shortcuts Modal -->
    <UModal v-model:open="showShortcuts" title="Keyboard Shortcuts" description="Available shortcuts during study">
      <template #body>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-default">Flip card</span>
            <div class="flex gap-1">
              <UKbd value="Space" />
              <UKbd value="Enter" />
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Rate: Again</span>
            <UKbd value="1" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Rate: Hard</span>
            <UKbd value="2" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Rate: Good</span>
            <UKbd value="3" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Rate: Easy</span>
            <UKbd value="4" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Previous card</span>
            <UKbd value="←" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Exit focus mode</span>
            <UKbd value="Esc" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Show shortcuts</span>
            <UKbd value="?" />
          </div>
        </div>
      </template>
    </UModal>
  </UPage>
</template>

<!-- Feature 19: Confetti animation styles -->
<style scoped>
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 50;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -10px;
  opacity: 0;
  animation: confetti-fall 3s ease-in forwards;
  animation-delay: calc(var(--i) * 0.1s);
}

.confetti-piece:nth-child(odd) {
  background: var(--color-primary);
  border-radius: 50%;
}

.confetti-piece:nth-child(even) {
  background: var(--color-warning, #f59e0b);
  border-radius: 2px;
}

.confetti-piece:nth-child(3n) {
  background: var(--color-success, #22c55e);
  width: 8px;
  height: 12px;
}

.confetti-piece:nth-child(1) { left: 5%; }
.confetti-piece:nth-child(2) { left: 10%; }
.confetti-piece:nth-child(3) { left: 15%; }
.confetti-piece:nth-child(4) { left: 20%; }
.confetti-piece:nth-child(5) { left: 25%; }
.confetti-piece:nth-child(6) { left: 30%; }
.confetti-piece:nth-child(7) { left: 35%; }
.confetti-piece:nth-child(8) { left: 40%; }
.confetti-piece:nth-child(9) { left: 45%; }
.confetti-piece:nth-child(10) { left: 50%; }
.confetti-piece:nth-child(11) { left: 55%; }
.confetti-piece:nth-child(12) { left: 60%; }
.confetti-piece:nth-child(13) { left: 65%; }
.confetti-piece:nth-child(14) { left: 70%; }
.confetti-piece:nth-child(15) { left: 75%; }
.confetti-piece:nth-child(16) { left: 80%; }
.confetti-piece:nth-child(17) { left: 85%; }
.confetti-piece:nth-child(18) { left: 90%; }
.confetti-piece:nth-child(19) { left: 95%; }
.confetti-piece:nth-child(20) { left: 50%; }

@keyframes confetti-fall {
  0% {
    opacity: 1;
    top: -10px;
    transform: rotate(0deg) translateX(0);
  }
  100% {
    opacity: 0;
    top: 100vh;
    transform: rotate(720deg) translateX(calc((var(--i) - 10) * 5px));
  }
}
</style>
