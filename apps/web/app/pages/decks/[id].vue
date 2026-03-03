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

const { user } = useAuth()
const { decks } = useDecks()
const { cards, pending, refresh } = useDeckCards(deckId)
const { addCard: addCardMutation } = useAddCard(deckId)
const { editCard: editCardMutation } = useEditCard()
const { deleteCard: deleteCardMutation } = useDeleteCard()
const { bulkImport } = useBulkImportCards(deckId)

const deck = computed(() => decks.value?.find(d => d.id === deckId.value) ?? null)
const isOwner = computed(() => !!deck.value && !!user.value && deck.value.userId === user.value.id)

const showAddCard = ref(false)
const newFront = ref('')
const newBack = ref('')
const submitting = ref(false)
const addError = ref('')

// Edit card state
const editingCardId = ref<string | null>(null)
const editFront = ref('')
const editBack = ref('')
const editSubmitting = ref(false)
const editError = ref('')

// Delete card state
const deletingCardId = ref<string | null>(null)

// Feature 12: Delete confirmation dialog
const confirmDeleteCardId = ref<string | null>(null)
const showDeleteConfirm = ref(false)

// Bulk add state
const showBulkAdd = ref(false)
const bulkCsv = ref('')
const bulkSubmitting = ref(false)
const bulkError = ref('')

// Export state
const exporting = ref(false)

// Share state
const linkCopied = ref(false)

// Feature 11: Card search/filter
const cardSearchQuery = ref('')
const filteredCards = computed(() => {
  const allCards = (cards.value ?? []) as Card[]
  const query = cardSearchQuery.value.trim().toLowerCase()
  if (!query) return allCards
  return allCards.filter(c =>
    c.front.toLowerCase().includes(query) || c.back.toLowerCase().includes(query),
  )
})

// Feature 14: Card sorting
const cardSortBy = ref<'newest' | 'oldest' | 'alpha'>('newest')
const sortedFilteredCards = computed(() => {
  const list = [...filteredCards.value]
  if (cardSortBy.value === 'alpha') {
    list.sort((a, b) => a.front.localeCompare(b.front))
  } else if (cardSortBy.value === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  return list
})

// Feature 13: Copy card to clipboard
const copiedCardId = ref<string | null>(null)
async function copyCardContent(card: Card) {
  if (!import.meta.client) return
  const text = `Front: ${card.front}\nBack: ${card.back}`
  await navigator.clipboard.writeText(text)
  copiedCardId.value = card.id
  setTimeout(() => { copiedCardId.value = null }, 2000)
}

// Collaborator state
const collabEmail = ref('')
const collabSubmitting = ref(false)
const collabError = ref('')
const { collaborators: collabs, refresh: refreshCollabs, addCollaborator: addCollabMutation } = useCollaborators(deckId)

async function addCollaborator() {
  if (!collabEmail.value.trim()) {
    collabError.value = 'Email is required.'
    return
  }
  collabError.value = ''
  collabSubmitting.value = true
  try {
    await addCollabMutation(collabEmail.value.trim())
    collabEmail.value = ''
    await refreshCollabs()
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'data' in e && e.data && typeof (e.data as { message?: string }).message === 'string'
      ? (e.data as { message: string }).message
      : 'Failed to add collaborator.'
    collabError.value = msg
  } finally {
    collabSubmitting.value = false
  }
}

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

function cancelBulkAdd() {
  showBulkAdd.value = false
  bulkError.value = ''
}

function startEditCard(card: Card) {
  editingCardId.value = card.id
  editFront.value = card.front
  editBack.value = card.back
  editError.value = ''
}

function cancelEditCard() {
  editingCardId.value = null
  editError.value = ''
}

async function saveEditCard() {
  if (!editFront.value.trim() || !editBack.value.trim()) {
    editError.value = 'Front and back are required.'
    return
  }
  if (!editingCardId.value) return
  editError.value = ''
  editSubmitting.value = true
  try {
    await editCardMutation(editingCardId.value, { front: editFront.value, back: editBack.value })
    editingCardId.value = null
    await refresh()
  } catch (e: unknown) {
    editError.value = e instanceof Error ? e.message : 'Failed to update card.'
  } finally {
    editSubmitting.value = false
  }
}

// Feature 12: Confirmation before delete
function promptDeleteCard(cardId: string) {
  confirmDeleteCardId.value = cardId
  showDeleteConfirm.value = true
}

async function confirmAndDeleteCard() {
  if (!confirmDeleteCardId.value) return
  const cardId = confirmDeleteCardId.value
  showDeleteConfirm.value = false
  confirmDeleteCardId.value = null
  deletingCardId.value = cardId
  try {
    await deleteCardMutation(cardId)
    await refresh()
  } finally {
    deletingCardId.value = null
  }
}

function parseCsv(text: string): Array<{ front: string; back: string }> {
  const results: Array<{ front: string; back: string }> = []
  const lines = text.trim().split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.toLowerCase() === 'front,back') continue
    const match = trimmed.match(/^"(.+?)"\s*,\s*"(.+?)"$/)
    if (match && match[1] && match[2]) {
      results.push({ front: match[1].replaceAll('""', '"'), back: match[2].replaceAll('""', '"') })
    } else {
      const parts = trimmed.split(',')
      if (parts.length >= 2 && parts[0] && parts[1]) {
        results.push({ front: parts[0].trim(), back: parts.slice(1).join(',').trim() })
      }
    }
  }
  return results
}

async function bulkAddCards() {
  const parsed = parseCsv(bulkCsv.value)
  if (parsed.length === 0) {
    bulkError.value = 'No valid cards found. Use format: front,back (one per line).'
    return
  }
  bulkError.value = ''
  bulkSubmitting.value = true
  try {
    await bulkImport(parsed)
    bulkCsv.value = ''
    showBulkAdd.value = false
    await refresh()
  } catch (e: unknown) {
    bulkError.value = e instanceof Error ? e.message : 'Failed to import cards.'
  } finally {
    bulkSubmitting.value = false
  }
}

function exportDeck() {
  if (!import.meta.client) return
  exporting.value = true
  const link = document.createElement('a')
  link.href = `/api/decks/${deckId.value}/export`
  link.download = `${deck.value?.name ?? 'deck'}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => { exporting.value = false }, 1000)
}

async function copyShareLink() {
  const url = `${window.location.origin}/study/${deckId.value}`
  await navigator.clipboard.writeText(url)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
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
        <UButton
          v-if="deck"
          variant="ghost"
          color="neutral"
          :icon="linkCopied ? 'i-lucide-check' : 'i-lucide-share-2'"
          @click="copyShareLink"
        >
          {{ linkCopied ? 'Copied!' : 'Share' }}
        </UButton>
      </template>
    </UPageHeader>

    <div v-if="!deck && !pending" class="rounded-lg border border-default bg-muted p-4">
      <p class="text-muted">Deck not found.</p>
      <UButton to="/" class="mt-2">Back to dashboard</UButton>
    </div>

    <template v-else-if="deck">
      <div v-if="!isOwner" class="mb-4 rounded-lg border border-default bg-muted p-3 text-sm text-default-muted">
        You can view this deck. Only the owner can add or edit cards.
      </div>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <!-- Feature 20: Deck stats -->
        <div class="flex items-center gap-3">
          <p class="text-default-muted text-sm">
            {{ cards?.length ?? 0 }} card{{ (cards?.length ?? 0) === 1 ? '' : 's' }}
          </p>
          <!-- Feature 15: Privacy indicator -->
          <span v-if="deck.isPublic" class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-default-muted">
            <UIcon name="i-lucide-globe" class="size-3" /> Public
          </span>
          <span v-else class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-default-muted">
            <UIcon name="i-lucide-lock" class="size-3" /> Private
          </span>
        </div>
        <div v-if="isOwner" class="flex flex-wrap gap-2">
          <UButton
            v-if="!showAddCard"
            size="sm"
            icon="i-lucide-plus"
            color="primary"
            @click="showAddCard = true"
          >
            Add card
          </UButton>
          <UButton
            v-if="!showBulkAdd"
            size="sm"
            icon="i-lucide-upload"
            color="neutral"
            variant="soft"
            @click="showBulkAdd = true"
          >
            Bulk import
          </UButton>
          <UButton
            size="sm"
            icon="i-lucide-download"
            color="neutral"
            variant="soft"
            :loading="exporting"
            @click="exportDeck"
          >
            Export CSV
          </UButton>
        </div>
      </div>

      <!-- Feature 11: Card search + Feature 14: Sort -->
      <div v-if="(cards?.length ?? 0) > 0" class="mb-4 flex flex-wrap items-center gap-3">
        <UInput
          v-model="cardSearchQuery"
          placeholder="Search cards..."
          icon="i-lucide-search"
          size="sm"
          class="max-w-xs"
        />
        <div class="flex items-center gap-1">
          <span class="text-xs text-default-muted">Sort:</span>
          <UButton
            size="xs"
            :variant="cardSortBy === 'newest' ? 'soft' : 'ghost'"
            :color="cardSortBy === 'newest' ? 'primary' : 'neutral'"
            @click="cardSortBy = 'newest'"
          >
            Newest
          </UButton>
          <UButton
            size="xs"
            :variant="cardSortBy === 'oldest' ? 'soft' : 'ghost'"
            :color="cardSortBy === 'oldest' ? 'primary' : 'neutral'"
            @click="cardSortBy = 'oldest'"
          >
            Oldest
          </UButton>
          <UButton
            size="xs"
            :variant="cardSortBy === 'alpha' ? 'soft' : 'ghost'"
            :color="cardSortBy === 'alpha' ? 'primary' : 'neutral'"
            @click="cardSortBy = 'alpha'"
          >
            A-Z
          </UButton>
        </div>
        <p v-if="cardSearchQuery && filteredCards.length !== (cards?.length ?? 0)" class="text-xs text-default-muted">
          Showing {{ filteredCards.length }} of {{ cards?.length ?? 0 }}
        </p>
      </div>

      <div v-if="isOwner && showAddCard" class="card-base mb-6 space-y-4 p-6">
        <h3 class="font-display font-semibold">New card</h3>
        <UFormField label="Front (Markdown supported)">
          <UTextarea v-model="newFront" placeholder="Question or term" :rows="3" />
        </UFormField>
        <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
        <div v-if="newFront.trim()" class="rounded-lg border border-default bg-muted p-3 text-sm" v-html="renderMarkdown(newFront)" />
        <UFormField label="Back (Markdown supported)">
          <UTextarea v-model="newBack" placeholder="Answer or definition" :rows="3" />
        </UFormField>
        <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
        <div v-if="newBack.trim()" class="rounded-lg border border-default bg-muted p-3 text-sm" v-html="renderMarkdown(newBack)" />
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

      <!-- Bulk Import Form -->
      <div v-if="isOwner && showBulkAdd" class="card-base mb-6 space-y-4 p-6">
        <h3 class="font-display font-semibold">Bulk Import</h3>
        <p class="text-sm text-default-muted">Paste CSV data with one card per line. Format: front,back</p>
        <UFormField label="CSV data">
          <UTextarea v-model="bulkCsv" placeholder="front,back&#10;What is 2+2?,4&#10;Capital of France?,Paris" :rows="6" />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton :loading="bulkSubmitting" color="primary" @click="bulkAddCards">
            Import cards
          </UButton>
          <UButton variant="ghost" color="neutral" @click="cancelBulkAdd">
            Cancel
          </UButton>
        </div>
        <p v-if="bulkError" class="text-sm text-muted">{{ bulkError }}</p>
      </div>

      <ul v-if="sortedFilteredCards.length" class="space-y-3">
        <li
          v-for="card in sortedFilteredCards"
          :key="card.id"
          class="card-base flex flex-col gap-2 p-4 transition-base"
        >
          <!-- Edit mode -->
          <template v-if="editingCardId === card.id">
            <div class="space-y-3">
              <UFormField label="Front (Markdown supported)">
                <UTextarea v-model="editFront" :rows="3" />
              </UFormField>
              <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
              <div v-if="editFront.trim()" class="rounded-lg border border-default bg-muted p-3 text-sm" v-html="renderMarkdown(editFront)" />
              <UFormField label="Back (Markdown supported)">
                <UTextarea v-model="editBack" :rows="3" />
              </UFormField>
              <!-- eslint-disable-next-line vue/no-v-html -- Content sanitized by useMarkdown -->
              <div v-if="editBack.trim()" class="rounded-lg border border-default bg-muted p-3 text-sm" v-html="renderMarkdown(editBack)" />
              <p v-if="editError" class="text-sm text-muted">{{ editError }}</p>
              <div class="flex flex-wrap gap-2">
                <UButton :loading="editSubmitting" color="primary" size="sm" @click="saveEditCard">
                  Save
                </UButton>
                <UButton variant="ghost" color="neutral" size="sm" @click="cancelEditCard">
                  Cancel
                </UButton>
              </div>
            </div>
          </template>

          <!-- View mode -->
          <template v-else>
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
            <div v-if="isOwner" class="flex gap-2 pt-1">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-pencil"
                @click="startEditCard(card)"
              >
                Edit
              </UButton>
              <!-- Feature 13: Copy card -->
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                :icon="copiedCardId === card.id ? 'i-lucide-check' : 'i-lucide-copy'"
                @click="copyCardContent(card)"
              >
                {{ copiedCardId === card.id ? 'Copied!' : 'Copy' }}
              </UButton>
              <!-- Feature 12: Delete with confirmation -->
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :loading="deletingCardId === card.id"
                @click="promptDeleteCard(card.id)"
              >
                Delete
              </UButton>
            </div>
          </template>
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

      <!-- Collaborators Section -->
      <div v-if="isOwner" class="mt-8">
        <USeparator />
        <h3 class="mt-6 font-display font-semibold text-default">Collaborators</h3>
        <p class="mt-1 text-sm text-default-muted">
          Invite other users by email to add cards to this deck.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UInput
            v-model="collabEmail"
            placeholder="user@example.com"
            size="sm"
            class="max-w-xs"
          />
          <UButton
            size="sm"
            icon="i-lucide-user-plus"
            color="primary"
            :loading="collabSubmitting"
            @click="addCollaborator"
          >
            Add
          </UButton>
        </div>
        <p v-if="collabError" class="mt-1 text-sm text-muted">{{ collabError }}</p>
        <ul v-if="collabs?.length" class="mt-3 space-y-1">
          <li
            v-for="collab in collabs"
            :key="collab.id"
            class="flex items-center gap-2 rounded-lg border border-default px-3 py-2 text-sm"
          >
            <UIcon name="i-lucide-user" class="size-4 text-default-muted" />
            <span class="text-default">{{ collab.email }}</span>
            <span v-if="collab.name" class="text-default-muted">({{ collab.name }})</span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-default-muted">No collaborators yet.</p>
      </div>
    </template>

    <!-- Feature 12: Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteConfirm" title="Delete Card" description="Are you sure you want to delete this card? This action cannot be undone.">
      <template #body>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="showDeleteConfirm = false">
            Cancel
          </UButton>
          <UButton color="error" @click="confirmAndDeleteCard">
            Delete
          </UButton>
        </div>
      </template>
    </UModal>
  </UPage>
</template>
