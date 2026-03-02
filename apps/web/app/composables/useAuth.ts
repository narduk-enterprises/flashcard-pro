/**
 * Reactive auth state. SSR-safe via useState.
 * Viewing decks is public; creating decks requires login.
 */
export type AuthUser = { id: string; email: string; name: string | null }

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)

  async function fetchUser() {
    try {
      const data = await $fetch<{ user: AuthUser }>('/api/auth/me', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      user.value = data.user
      return data.user
    } catch {
      user.value = null
      return null
    }
  }

  async function login(body: { email: string; password: string }) {
    const data = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    user.value = data.user
    return data.user
  }

  async function register(body: { email: string; password: string; name?: string }) {
    const data = await $fetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: { email: body.email, password: body.password, name: body.name ?? '' },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    user.value = data.user
    return data.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    user.value = null
  }

  const isLoggedIn = computed(() => user.value !== null)

  return { user, isLoggedIn, fetchUser, login, register, logout }
}
