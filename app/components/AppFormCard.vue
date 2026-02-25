<script setup lang="ts">
/**
 * AppFormCard — Standardized wrapper for forms.
 *
 * Provides consistent max-width, optional header (title + description),
 * and the UCard chrome so every form across the app looks cohesive.
 *
 * @example
 * <AppFormCard title="Contact Us" description="We'll get back to you soon." size="wide">
 *   <UForm ...>...</UForm>
 * </AppFormCard>
 */
const props = withDefaults(defineProps<{
  /** Card heading */
  title?: string
  /** Subheading / helper text */
  description?: string
  /** Optional icon displayed next to the title */
  icon?: string
  /**
   * Width preset:
   * - 'narrow' = 24rem (login, signup)
   * - 'default' = 32rem (general forms)
   * - 'wide' = 40rem (multi-column, settings)
   * - 'full' = no max-width (inside cards/sidebars)
   */
  size?: 'narrow' | 'default' | 'wide' | 'full'
}>(), {
  size: 'default',
})

const sizeClass = computed(() => {
  const map: Record<string, string> = {
    narrow: 'form-container form-narrow',
    default: 'form-container',
    wide: 'form-container form-wide',
    full: 'form-full',
  }
  return map[props.size] || 'form-container'
})
</script>

<template>
  <div :class="sizeClass">
    <UCard>
      <template v-if="title" #header>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <UIcon v-if="icon" :name="icon" class="text-primary size-5" />
            <h2 class="font-display text-xl font-semibold">{{ title }}</h2>
          </div>
          <p v-if="description" class="text-sm text-muted">{{ description }}</p>
        </div>
      </template>

      <slot />
    </UCard>
  </div>
</template>
