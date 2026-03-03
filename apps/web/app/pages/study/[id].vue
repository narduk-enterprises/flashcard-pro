<script setup lang="ts">
import type { Card } from '../../types/flashcard'

const route = useRoute()
const deckId = computed(() => route.params.id as string)

const { deck, pending: deckPending } = useDeck(deckId)

// Dynamic SEO — updates when deck data loads
const seoTitle = computed(() => deck.value ? `Study ${deck.value.name} — FlashCardPro` : 'Study — FlashCardPro')
const seoDescription = computed(() => deck.value ? `Study "${deck.value.name}" with spaced repetition. ${deck.value.cardCount ?? 0} flashcards.` : 'Study this deck with spaced repetition.')

useSeo({
  title: seoTitle.value,
  description: seoDescription.value,
})
useWebPageSchema({
  name: seoTitle.value,
  description: seoDescription.value,
})

watch(deck, (d) => {
  if (d) {
    useSeo({
      title: `Study ${d.name} — FlashCardPro`,
      description: `Study "${d.name}" with spaced repetition. ${d.cardCount ?? 0} flashcards.`,
    })
    useBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Discover', url: '/discover' },
      { name: `Study: ${d.name}`, url: `/study/${d.id}` },
    ])
  }
})

const { cards, pending: cardsPending, refresh } = useDeckCards(deckId)
const { render: renderMarkdown } = useMarkdown()
const { submitReview } = useSubmitReview()
import { useSwipe } from '@vueuse/core'

const pending = computed(() => deckPending.value || cardsPending.value)
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
  stopTimer()
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
const missedCardIds = ref<string[]>([])

function addMissedCard(cardId: string) {
  if (!missedCardIds.value.includes(cardId)) {
    missedCardIds.value = [...missedCardIds.value, cardId]
  }
}

const missedCardCount = computed(() => missedCardIds.value.length)

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

// Score ring computed values
const scoreCircumference = 2 * Math.PI * 45 // radius 45
const scoreOffset = computed(() => {
  return scoreCircumference - (scorePercent.value / 100) * scoreCircumference
})

// Time per card
const timePerCard = computed(() => {
  if (sessionTotal.value === 0) return '0s'
  const secs = Math.round(elapsedSeconds.value / sessionTotal.value)
  if (secs >= 60) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }
  return `${secs}s`
})

// Score color
const scoreColor = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return 'rgb(34 197 94)' // green
  if (p >= 60) return 'rgb(59 130 246)' // blue
  if (p >= 40) return 'rgb(245 158 11)' // amber
  return 'rgb(239 68 68)' // red
})

const scoreLabel = computed(() => {
  const p = scorePercent.value
  if (p >= 90) return 'Excellent!'
  if (p >= 75) return 'Great job!'
  if (p >= 50) return 'Good effort'
  return 'Keep practicing'
})

// Confetti colors
// eslint-disable-next-line atx/no-inline-hex
const confettiColors = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#14B8A6']

function getConfettiStyle(n: number) {
  const color = confettiColors[n % confettiColors.length]!
  const rot = 360 + Math.random() * 720
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const size = 6 + Math.random() * 8
  const shapes = ['50%', '2px', '0'] // circle, square-ish, sharp
  const radius = shapes[n % shapes.length]
  return {
    '--i': n,
    '--rot': rot,
    backgroundColor: color,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: radius,
    animationDelay: `${delay}s`,
  }
}

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
      addMissedCard(currentCard.value.id)
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

// Feature 25: Swipe gestures
const swipeTarget = ref<HTMLElement | null>(null)
const { direction, isSwiping, lengthX } = useSwipe(swipeTarget)

watch(isSwiping, (swiping) => {
  if (!swiping) {
    if (direction.value === 'left' && lengthX.value <= -50) {
      if (canRate.value) {
        // Default to 'Good' when swiping next
        rate(3)
      } else if (!flipped.value) {
        flip()
      }
    } else if (direction.value === 'right' && lengthX.value >= 50) {
      goToPreviousCard()
    }
  }
})

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
  missedCardIds.value = []
  elapsedSeconds.value = 0
  startTimer()
  refresh()
}

// Feature 8: Study only missed cards
function studyMissedCards() {
  const allCards = cardList.value
  const missed = allCards.filter(c => missedCardIds.value.includes(c.id))
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
  missedCardIds.value = []
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
  <UPage :class="{ 'fixed inset-0 z-[100] flex flex-col items-center justify-center p-8': focusMode }">
    <!-- Focus mode backdrop -->
    <div
      v-if="focusMode"
      class="absolute inset-0 -z-10"
      aria-hidden="true"
    >
      <div class="absolute inset-0 bg-default opacity-90" />
      <div class="absolute inset-0 opacity-30" style="background: radial-gradient(ellipse at 30% 20%, rgb(139 92 246 / 0.3), transparent 60%), radial-gradient(ellipse at 70% 80%, rgb(59 130 246 / 0.2), transparent 60%);" />
    </div>

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

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- Session Complete                                    -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-else-if="sessionComplete" class="mx-auto max-w-2xl">
      <!-- Confetti v2 -->
      <div class="confetti-container" aria-hidden="true">
        <div
          v-for="n in 30"
          :key="n"
          class="confetti-piece"
          :style="getConfettiStyle(n)"
        />
      </div>

      <div class="card-base relative overflow-hidden p-8 text-center">
        <!-- Gradient accent at top -->
        <div class="absolute inset-x-0 top-0 h-1" style="background: linear-gradient(90deg, #8B5CF6, #3B82F6, #EC4899);" />

        <!-- Score Ring -->
        <div class="mx-auto mb-6 relative" style="width: 140px; height: 140px;">
          <!-- eslint-disable-next-line atx/no-inline-svg -->
          <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <!-- Background ring -->
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              class="text-muted"
              stroke-width="6"
            />
            <!-- Score ring -->
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              :stroke="scoreColor"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="scoreCircumference"
              :stroke-dashoffset="scoreCircumference"
              class="animate-score-ring"
              :style="{ '--score-circumference': scoreCircumference, '--score-offset': scoreOffset }"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold font-display" :style="{ color: scoreColor }">{{ scorePercent }}%</span>
            <span class="text-xs text-default-muted mt-0.5">score</span>
          </div>
        </div>

        <h2 class="font-display text-2xl font-bold text-default">{{ scoreLabel }}</h2>
        <p class="mt-2 text-default-muted">
          You reviewed {{ sessionTotal }} card{{ sessionTotal === 1 ? '' : 's' }} in this session.
        </p>

        <!-- Stats Grid -->
        <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="card-base flex flex-col items-center justify-center p-4 border-l-4 border-error">
            <div class="flex items-center justify-center gap-1.5 mb-1 bg-error/10 rounded-full px-2.5 py-1">
              <UIcon name="i-lucide-rotate-ccw" class="size-4 text-error" />
            </div>
            <p class="text-3xl font-display font-bold text-error mt-2">{{ sessionStats.again }}</p>
            <p class="text-xs font-medium text-default-muted mt-1 uppercase tracking-wider">Again</p>
          </div>
          <div class="card-base flex flex-col items-center justify-center p-4 border-l-4 border-warning">
            <div class="flex items-center justify-center gap-1.5 mb-1 bg-warning/10 rounded-full px-2.5 py-1">
              <UIcon name="i-lucide-alert-triangle" class="size-4 text-warning" />
            </div>
            <p class="text-3xl font-display font-bold text-warning mt-2">{{ sessionStats.hard }}</p>
            <p class="text-xs font-medium text-default-muted mt-1 uppercase tracking-wider">Hard</p>
          </div>
          <div class="card-base flex flex-col items-center justify-center p-4 border-l-4 border-primary">
            <div class="flex items-center justify-center gap-1.5 mb-1 bg-primary/10 rounded-full px-2.5 py-1">
              <UIcon name="i-lucide-check" class="size-4 text-primary" />
            </div>
            <p class="text-3xl font-display font-bold text-primary mt-2">{{ sessionStats.good }}</p>
            <p class="text-xs font-medium text-default-muted mt-1 uppercase tracking-wider">Good</p>
          </div>
          <div class="card-base flex flex-col items-center justify-center p-4 border-l-4 border-success">
            <div class="flex items-center justify-center gap-1.5 mb-1 bg-success/10 rounded-full px-2.5 py-1">
              <UIcon name="i-lucide-zap" class="size-4 text-success" />
            </div>
            <p class="text-3xl font-display font-bold text-success mt-2">{{ sessionStats.easy }}</p>
            <p class="text-xs font-medium text-default-muted mt-1 uppercase tracking-wider">Easy</p>
          </div>
        </div>

        <!-- Time stats -->
        <div class="mt-4 flex items-center justify-center gap-6 text-sm text-default-muted">
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-clock" class="size-4" />
            {{ formattedTime }}
          </span>
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-timer" class="size-4" />
            {{ timePerCard }} / card
          </span>
        </div>

        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <UButton icon="i-lucide-rotate-ccw" color="primary" @click="restartSession">
            Study again
          </UButton>
          <!-- Feature 8: Study missed cards only -->
          <UButton
            v-if="missedCardCount > 0"
            icon="i-lucide-target"
            color="warning"
            variant="soft"
            @click="studyMissedCards"
          >
            Study missed ({{ missedCardCount }})
          </UButton>
          <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-home">
            Dashboard
          </UButton>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- Study Cards                                         -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-else class="mx-auto max-w-2xl">
      <!-- Status bar: position + timer -->
      <div class="mb-3 flex items-center justify-between">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <UIcon name="i-lucide-layers" class="size-3.5" />
          {{ cardPositionLabel }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-default-muted">
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span class="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          {{ formattedTime }}
        </span>
      </div>

      <!-- Progress Bar -->
      <div class="mb-5">
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted/80 dark:bg-elevated/50 shadow-inner">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
            style="background: linear-gradient(90deg, #8B5CF6, #3B82F6, #8B5CF6); background-size: 200% 100%; animation: gradient-shift 4s ease infinite;"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- Navigation row -->
      <div class="mb-3 flex items-center justify-between">
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
        <!-- Shortcut help button -->
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

      <!-- ═══ The Flashcard ═══ -->
      <div class="relative group mt-2 sm:mt-0">
        <!-- Floating Swipe Hint (Mobile only) -->
        <div v-if="!flipped && currentCard" class="absolute -top-10 inset-x-0 flex justify-center sm:hidden z-10 pointer-events-none opacity-60">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white shadow-lg animate-float">
            <UIcon name="i-lucide-hand" class="size-3.5" />
            Tap to flip
          </span>
        </div>

        <div
          ref="swipeTarget"
          class="study-card-glass cursor-pointer select-none overflow-hidden touch-pan-y"
          :class="{ 'study-card-glass-flipped': flipped, 'focus-glow': focusMode }"
          style="min-height: 24rem; perspective: 1200px;"
          @click="flip"
        >
          <div
            class="study-card-inner relative w-full h-full transition-transform duration-500"
            style="transform-style: preserve-3d; min-height: 24rem;"
            :style="{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
          >
            <!-- FRONT -->
            <div
              class="absolute inset-0 flex flex-col justify-center p-6 sm:p-10"
              style="backface-visibility: hidden;"
            >
              <div class="absolute inset-x-0 top-0 h-1" style="background: linear-gradient(90deg, #8B5CF6, #3B82F6);" />
              <div class="absolute top-6 left-6 flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                  <UIcon name="i-lucide-eye" class="size-3.5" />
                  FRONT
                </span>
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
              <div v-if="currentCard" class="text-default text-xl sm:text-2xl leading-relaxed text-center font-medium mt-8" v-html="renderMarkdown(displayFront)" />
              <p class="absolute bottom-6 inset-x-0 text-default-muted text-center text-sm opacity-70 transition-opacity group-hover:opacity-100 hidden sm:block">
                Press <UKbd value="Space" class="mx-0.5 shadow-sm" /> to flip
              </p>
            </div>
            <!-- BACK -->
            <div
              class="absolute inset-0 flex flex-col justify-center p-6 sm:p-10"
              style="backface-visibility: hidden; transform: rotateY(180deg);"
            >
              <div class="absolute inset-x-0 top-0 h-1" style="background: linear-gradient(90deg, #10B981, #34D399);" />
              <div class="absolute top-6 left-6 flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-success shadow-sm">
                  <UIcon name="i-lucide-lightbulb" class="size-3.5" />
                  BACK
                </span>
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
              <div v-if="currentCard" class="text-default text-xl sm:text-2xl leading-relaxed text-center font-medium mt-8" v-html="renderMarkdown(displayBack)" />
              <p class="absolute bottom-6 inset-x-0 text-default-muted text-center text-sm opacity-70 transition-opacity group-hover:opacity-100 hidden sm:block">
                Press <UKbd value="Space" class="mx-0.5 shadow-sm" /> to flip back
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Rating Buttons ═══ -->
      <div v-if="canRate" class="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 mobile-rating-bar sm:relative sm:bottom-auto sm:bg-transparent sm:border-none sm:shadow-none sm:p-0">
        <UButton
          color="error"
          variant="soft"
          size="xl"
          icon="i-lucide-rotate-ccw"
          class="animate-bounce-in flex-1 sm:flex-none shadow-sm hover:shadow-md"
          :style="{ animationDelay: '0ms' }"
          @click="rate(1)"
        >
          <span class="font-medium tracking-wide">Again</span>
          <UKbd value="1" class="ml-1 hidden sm:inline-flex opacity-70" />
        </UButton>
        <UButton
          color="warning"
          variant="soft"
          size="xl"
          icon="i-lucide-alert-triangle"
          class="animate-bounce-in flex-1 sm:flex-none shadow-sm hover:shadow-md"
          :style="{ animationDelay: '40ms' }"
          @click="rate(2)"
        >
          <span class="font-medium tracking-wide">Hard</span>
          <UKbd value="2" class="ml-1 hidden sm:inline-flex opacity-70" />
        </UButton>
        <UButton
          color="primary"
          variant="soft"
          size="xl"
          icon="i-lucide-check"
          class="animate-bounce-in flex-1 sm:flex-none shadow-sm hover:shadow-md"
          :style="{ animationDelay: '80ms' }"
          @click="rate(3)"
        >
          <span class="font-medium tracking-wide">Good</span>
          <UKbd value="3" class="ml-1 hidden sm:inline-flex opacity-70" />
        </UButton>
        <UButton
          color="success"
          variant="soft"
          size="xl"
          icon="i-lucide-zap"
          class="animate-bounce-in flex-1 sm:flex-none shadow-sm hover:shadow-md"
          :style="{ animationDelay: '120ms' }"
          @click="rate(4)"
        >
          <span class="font-medium tracking-wide">Easy</span>
          <UKbd value="4" class="ml-1 hidden sm:inline-flex opacity-70" />
        </UButton>
      </div>

      <!-- Focus mode exit button -->
      <div v-if="focusMode" class="mt-6 text-center">
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

    <!-- Keyboard Shortcuts Modal -->
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
