<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()
const appName = useRuntimeConfig().public.appName || ''
const { user, isLoggedIn, logout } = useAuth()
const { locale, setLocale, availableLocales } = useAppI18n()
const isLoggingOut = ref(false)
const commandOpen = ref(false)
const commandQuery = ref('')

const appDisplayName = computed(() => appName || 'FlashCardPro')

function cycleLocale() {
  const idx = availableLocales.indexOf(locale.value)
  setLocale(availableLocales[(idx + 1) % availableLocales.length]!)
}

const colorModeIcon = computed(() => {
  if (colorMode.preference === 'system') return 'i-lucide-monitor'
  return colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
})

function cycleColorMode() {
  const modes = ['system', 'light', 'dark'] as const
  const idx = modes.indexOf(colorMode.preference as typeof modes[number])
  colorMode.preference = modes[(idx + 1) % modes.length]!
}

const navItems = [
  { label: 'Home', to: '/', icon: 'i-lucide-home' },
  { label: 'Discover', to: '/discover', icon: 'i-lucide-compass' },
]

const quickActions = computed(() => {
  const baseActions = navItems.map(item => ({ ...item, description: `Go to ${item.label.toLowerCase()} page` }))

  if (isLoggedIn.value) {
    return [
      ...baseActions,
      { label: 'New deck', to: '/decks/new', icon: 'i-lucide-plus', description: 'Create a new deck' },
    ]
  }

  return [
    ...baseActions,
    { label: 'Log in', to: '/login', icon: 'i-lucide-log-in', description: 'Access your account' },
    { label: 'Sign up', to: '/register', icon: 'i-lucide-user-plus', description: 'Create a new account' },
  ]
})

const filteredQuickActions = computed(() => {
  const query = commandQuery.value.trim().toLowerCase()
  if (!query) return quickActions.value

  return quickActions.value.filter(action => {
    return action.label.toLowerCase().includes(query) || action.description.toLowerCase().includes(query)
  })
})

const mobileMenuOpen = ref(false)

watch(route, () => {
  mobileMenuOpen.value = false
  commandOpen.value = false
  commandQuery.value = ''
})

function isActiveRoute(path: string) {
  return route.path === path
}

function openCommandPalette() {
  commandQuery.value = ''
  commandOpen.value = true
}

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (commandOpen.value) {
      commandOpen.value = false
      return
    }
    openCommandPalette()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})

function closeCommandPalette() {
  commandOpen.value = false
}

async function handleLogout() {
  isLoggingOut.value = true
  try {
    await logout()
    await navigateTo('/')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <UApp>
    <ULink to="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg">Skip to content</ULink>
    <div class="app-shell min-h-screen flex flex-col bg-linear-to-b from-primary-50/30 to-transparent dark:from-primary-950/20 dark:to-transparent">
      <!-- Header -->
      <div class="sticky top-0 z-50 glass border-b border-default shadow-card relative" role="banner">
        <div class="absolute inset-x-0 bottom-0 h-px" style="background: linear-gradient(90deg, transparent, rgb(139 92 246 / 0.4), rgb(59 130 246 / 0.3), rgb(139 92 246 / 0.4), transparent);" aria-hidden="true" />
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-2.5 group transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <img src="/logo.png" alt="" class="size-8 rounded-xl object-cover shadow-card" width="32" height="32">
            <span class="font-display font-semibold text-lg hidden sm:block">{{ appDisplayName }}</span>
          </NuxtLink>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="isActiveRoute(item.to)
                ? 'text-primary bg-primary/10'
                : 'text-muted hover:text-default hover:bg-elevated'"
              :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
            >
              {{ item.label }}
            </NuxtLink>
            <UButton
              v-if="isLoggedIn"
              to="/decks/new"
              size="sm"
              icon="i-lucide-plus"
              color="primary"
              class="ml-1"
            >
              New deck
            </UButton>
          </div>

          <div class="flex items-center gap-2">
            <template v-if="isLoggedIn">
              <span class="hidden sm:inline text-sm text-default-muted">{{ user?.email }}</span>
              <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                :loading="isLoggingOut"
                :disabled="isLoggingOut"
                @click="handleLogout"
              >
                Log out
              </UButton>
            </template>
            <template v-else>
              <UButton to="/login" size="sm" variant="ghost" color="neutral">
                Log in
              </UButton>
              <UButton to="/register" size="sm" color="primary">
                Sign up
              </UButton>
            </template>
            <UButton
              icon="i-lucide-search"
              variant="ghost"
              color="neutral"
              aria-label="Open quick navigation"
              @click="openCommandPalette"
            >
              <template #trailing>
                <UKbd value="⌘K" class="hidden md:inline-flex" />
              </template>
            </UButton>
            <UButton
              :icon="colorModeIcon"
              variant="ghost"
              color="neutral"
              aria-label="Toggle color mode"
              @click="cycleColorMode"
            />
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-languages"
              :aria-label="`Language: ${locale.toUpperCase()}`"
              @click="cycleLocale"
            >
              <span class="text-xs font-medium uppercase">{{ locale }}</span>
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              class="md:hidden p-2 rounded-lg hover:bg-elevated"
              aria-label="Toggle navigation menu"
              :aria-expanded="mobileMenuOpen"
              aria-controls="mobile-nav-menu"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
            </UButton>
          </div>
        </div>

        <!-- Mobile nav -->
        <Transition name="slide-down">
          <div id="mobile-nav-menu" v-if="mobileMenuOpen" class="md:hidden border-t border-default px-4 py-3 space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="isActiveRoute(item.to)
                ? 'text-primary bg-primary/10'
                : 'text-muted hover:text-default hover:bg-elevated'"
              :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
            >
              <UIcon :name="item.icon" class="size-4" />
              {{ item.label }}
            </NuxtLink>
            <UButton
              v-if="isLoggedIn"
              to="/decks/new"
              class="w-full justify-start gap-3"
              icon="i-lucide-plus"
              color="primary"
              variant="soft"
            >
              New deck
            </UButton>
            <template v-else>
              <NuxtLink
                to="/login"
                class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted hover:text-default hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <UIcon name="i-lucide-log-in" class="size-4" />
                Log in
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-primary bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <UIcon name="i-lucide-user-plus" class="size-4" />
                Sign up
              </NuxtLink>
            </template>
          </div>
        </Transition>
      </div>

      <UModal v-model:open="commandOpen" title="Quick navigation" description="Jump to key pages faster.">
        <template #body>
          <div class="space-y-3">
            <UInput
              v-model="commandQuery"
              icon="i-lucide-search"
              placeholder="Type to filter actions..."
              aria-label="Filter quick actions"
              autofocus
            />
            <div v-if="filteredQuickActions.length" class="space-y-1">
              <NuxtLink
                v-for="action in filteredQuickActions"
                :key="action.to"
                :to="action.to"
                class="flex items-start gap-3 rounded-lg border border-default px-3 py-2 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                @click="closeCommandPalette"
              >
                <UIcon :name="action.icon" class="mt-0.5 size-4 text-primary" />
                <div>
                  <p class="text-sm font-medium text-default">{{ action.label }}</p>
                  <p class="text-xs text-default-muted">{{ action.description }}</p>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="rounded-lg border border-default bg-default p-4 text-sm text-default-muted">
              No quick actions match your search.
            </div>
          </div>
        </template>
      </UModal>

      <!-- Main -->
      <div id="main-content" class="flex-1">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-default py-8 relative" role="contentinfo">
        <div class="absolute inset-x-0 top-0 h-px" style="background: linear-gradient(90deg, transparent, rgb(139 92 246 / 0.2), rgb(59 130 246 / 0.15), rgb(139 92 246 / 0.2), transparent);" aria-hidden="true" />
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div class="text-center sm:text-left">
              <p class="text-sm font-medium text-default">{{ appDisplayName }}</p>
              <p class="mt-1 text-xs text-muted max-w-md">Free flashcard app with spaced repetition. Create, study, and share decks to master any subject.</p>
            </div>
            <div class="flex flex-wrap justify-center gap-4 text-sm" role="navigation" aria-label="Footer navigation">
              <NuxtLink to="/" class="text-muted hover:text-default transition-colors">Home</NuxtLink>
              <NuxtLink to="/discover" class="text-muted hover:text-default transition-colors">Discover Decks</NuxtLink>
              <NuxtLink to="/login" class="text-muted hover:text-default transition-colors">Log in</NuxtLink>
              <NuxtLink to="/register" class="text-muted hover:text-default transition-colors">Sign up</NuxtLink>
            </div>
          </div>
          <p class="mt-4 text-center text-xs text-muted">
            &copy; <NuxtTime :datetime="new Date()" year="numeric" /> {{ appDisplayName }}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </UApp>
</template>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
