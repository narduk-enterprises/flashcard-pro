<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

/**
 * ContactForm — Ready-to-use contact form with Zod validation.
 *
 * Uses the standardized form layout classes (form-section, form-row, form-actions)
 * and AppFormCard wrapper for consistent styling.
 *
 * @example
 * <UiContactForm
 *   title="Get in Touch"
 *   description="We'd love to hear from you."
 *   endpoint="/api/contact"
 * />
 */
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  /** API endpoint to submit the form to */
  endpoint?: string
  submitLabel?: string
}>(), {
  title: 'Contact Us',
  submitLabel: 'Send Message',
  endpoint: '/api/contact',
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  subject: undefined,
  message: undefined,
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch(props.endpoint, {
      method: 'POST',
      body: event.data,
    })
    toast.add({
      title: 'Success',
      description: 'Your message has been sent! We\'ll get back to you soon.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    // Reset state
    state.name = undefined
    state.email = undefined
    state.subject = undefined
    state.message = undefined
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.data?.message || 'Something went wrong. Please try again.',
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
  }
}
</script>

<template>
  <AppFormCard
    :title="title"
    :description="description"
    icon="i-lucide-mail"
    size="wide"
  >
    <UForm :schema="schema" :state="state" class="form-section" @submit="onSubmit">
      <div class="form-row">
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" placeholder="Your name" icon="i-lucide-user" class="w-full" />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="you@example.com" icon="i-lucide-mail" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="Subject" name="subject" required>
        <UInput v-model="state.subject" placeholder="What is this about?" icon="i-lucide-message-square" class="w-full" />
      </UFormField>

      <UFormField label="Message" name="message" required>
        <UTextarea v-model="state.message" :rows="5" placeholder="Tell us what you need..." class="w-full" />
      </UFormField>

      <div class="form-actions">
        <UButton type="submit" size="lg" icon="i-lucide-send">
          {{ submitLabel }}
        </UButton>
      </div>
    </UForm>
  </AppFormCard>
</template>
