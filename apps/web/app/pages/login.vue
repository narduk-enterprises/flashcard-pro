<script setup lang="ts">
useSeo({
  title: 'Log in — FlashCardPro',
  description: 'Log in to create and manage your decks.',
})
useWebPageSchema({
  name: 'Log in — FlashCardPro',
  description: 'Log in to create and manage your decks.',
})

const route = useRoute()
const returnUrl = computed(() => (route.query.returnUrl as string) || '/')
const { login } = useAuth()
const state = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login({ email: state.email, password: state.password })
    await navigateTo(returnUrl.value)
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'data' in e && e.data && typeof (e.data as { message?: string }).message === 'string'
      ? (e.data as { message: string }).message
      : 'Login failed.'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-[60vh] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-8 pb-12">
    <div
      class="absolute inset-0 bg-default bg-cover bg-center opacity-40 dark:opacity-30"
      style="background-image: url('/images/auth-bg.webp');"
      aria-hidden="true"
    />
    <div class="relative flex flex-col items-center flex-1">
      <UPage>
        <UPageHeader title="Log in" description="Log in to create decks and manage your cards.">
          <template #links>
            <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
              Back
            </UButton>
          </template>
        </UPageHeader>

        <UForm :state="state" class="glass-card shadow-elevated max-w-sm w-full space-y-4 p-6 animate-count-in" @submit="onSubmit">
      <UFormField label="Email" name="email" required>
        <UInput v-model="state.email" type="email" placeholder="you@example.com" size="lg" />
      </UFormField>
      <UFormField label="Password" name="password" required>
        <UInput v-model="state.password" type="password" placeholder="••••••••" size="lg" />
      </UFormField>
      <p v-if="error" class="text-sm text-muted">
        {{ error }}
      </p>
      <div class="flex flex-col gap-2">
        <UButton type="submit" :loading="loading" color="primary" block>
          Log in
        </UButton>
        <p class="text-center text-sm text-default-muted">
          No account?
          <ULink to="/register" class="text-primary font-medium">Sign up</ULink>
        </p>
      </div>
    </UForm>
      </UPage>
    </div>
  </div>
</template>
