<template>
  <AppFormCard
    :title="loggedIn ? 'Your Account' : undefined"
    icon="i-lucide-shield-check"
    size="narrow"
  >
    <!-- Header with status badge -->
    <template v-if="!loggedIn" #default>
      <div class="space-y-4">
        <!-- Mode toggle -->
        <div class="flex gap-1">
          <UButton
            :variant="mode === 'login' ? 'solid' : 'ghost'"
            color="neutral"
            size="sm"
            class="flex-1"
            @click="mode = 'login'"
          >
            Sign In
          </UButton>
          <UButton
            :variant="mode === 'signup' ? 'solid' : 'ghost'"
            color="neutral"
            size="sm"
            class="flex-1"
            @click="mode = 'signup'"
          >
            Sign Up
          </UButton>
        </div>

        <UForm :schema="schema" :state="state" class="form-section" @submit="onSubmit">
          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              icon="i-lucide-mail"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Password" name="password">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              class="w-full"
            />
          </UFormField>

          <div class="form-actions form-actions-full">
            <UButton type="submit" :loading="submitting" icon="i-lucide-arrow-right">
              {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
            </UButton>
          </div>
        </UForm>

        <USeparator label="or" />

        <UButton
          block
          color="neutral"
          variant="soft"
          icon="i-lucide-apple"
          disabled
        >
          Sign in with Apple
        </UButton>
        <p class="text-xs text-center text-muted">
          Apple Sign-In requires keys configured in <code>.env</code>
        </p>
      </div>
    </template>

    <!-- Signed-in state -->
    <template v-else #default>
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <UAvatar :text="user?.email?.charAt(0).toUpperCase()" size="lg" />
          <div>
            <p class="font-medium text-sm">{{ user?.email }}</p>
            <p class="text-xs text-muted">Signed in</p>
          </div>
        </div>
        <div class="form-actions form-actions-full">
          <UButton color="neutral" variant="soft" icon="i-lucide-log-out" :loading="submitting" @click="handleLogout">
            Sign Out
          </UButton>
        </div>
      </div>
    </template>

    <!-- Error/success toast -->
    <div v-if="message" class="mt-3">
      <UAlert
        :color="messageType === 'error' ? 'error' : 'success'"
        :title="message"
        :icon="messageType === 'error' ? 'i-lucide-alert-circle' : 'i-lucide-check-circle'"
        variant="subtle"
      />
    </div>
  </AppFormCard>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { user, loggedIn, login, signup, logout } = useAuth()

const mode = ref<'login' | 'signup'>('login')
const submitting = ref(false)
const message = ref('')
const messageType = ref<'error' | 'success'>('success')

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
})

function showMessage(msg: string, type: 'error' | 'success' = 'success') {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 4000)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  message.value = ''
  try {
    if (mode.value === 'login') {
      await login(event.data.email, event.data.password)
      showMessage('Signed in!')
    } else {
      await signup(event.data.email, event.data.password)
      showMessage('Account created!')
    }
    state.email = undefined
    state.password = undefined
  }
  catch (err: any) {
    showMessage(err?.data?.message || err?.message || 'Something went wrong', 'error')
  }
  finally {
    submitting.value = false
  }
}

async function handleLogout() {
  submitting.value = true
  try {
    await logout()
    showMessage('Signed out')
  }
  catch (err: any) {
    showMessage(err?.data?.message || 'Logout failed', 'error')
  }
  finally {
    submitting.value = false
  }
}
</script>
