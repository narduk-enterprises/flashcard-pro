<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeo({
  title: 'New deck — FlashCardPro',
  description: 'Create a new flashcard deck.',
  robots: 'noindex, nofollow',
})
useWebPageSchema({
  name: 'New deck — FlashCardPro',
  description: 'Create a new flashcard deck.',
})

const state = reactive({ name: '', description: '', tags: '', isPublic: true })
const submitting = ref(false)
const error = ref('')
const { createDeck } = useCreateDeck()

async function submit() {
  if (!state.name.trim()) {
    error.value = 'Name is required.'
    return
  }
  error.value = ''
  submitting.value = true
  try {
    const deck = await createDeck({ name: state.name, description: state.description, tags: state.tags, isPublic: state.isPublic })
    await navigateTo(`/decks/${deck.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create deck.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UPage>
    <UPageHeader title="New deck" description="Create a new flashcard deck.">
      <template #links>
        <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
          Back
        </UButton>
      </template>
    </UPageHeader>

    <UForm :state="state" class="card-base max-w-xl space-y-4 p-6" @submit="submit">
      <UFormField label="Name" name="name" required>
        <UInput v-model="state.name" placeholder="e.g. Spanish verbs" size="lg" />
      </UFormField>
      <UFormField label="Description" name="description">
        <UTextarea v-model="state.description" placeholder="Optional description" :rows="2" />
      </UFormField>
      <UFormField label="Tags" name="tags" description="Comma-separated tags (e.g. spanish, verbs, language)">
        <UInput v-model="state.tags" placeholder="e.g. spanish, verbs, language" />
      </UFormField>
      <!-- Feature 18: Public/Private toggle -->
      <UFormField label="Visibility" name="isPublic" description="Public decks can be discovered and studied by others.">
        <div class="flex items-center gap-3">
          <USwitch v-model="state.isPublic" />
          <span class="text-sm text-default-muted">
            {{ state.isPublic ? 'Public — visible to everyone' : 'Private — only visible to you' }}
          </span>
        </div>
      </UFormField>
      <p v-if="error" class="text-sm text-muted">
        {{ error }}
      </p>
      <div class="flex gap-2">
        <UButton type="submit" :loading="submitting" color="primary">
          Create deck
        </UButton>
        <UButton to="/" variant="ghost" color="neutral">
          Cancel
        </UButton>
      </div>
    </UForm>
  </UPage>
</template>
