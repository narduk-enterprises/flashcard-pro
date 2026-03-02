/**
 * Hydrate auth state on client so nav shows logged-in state.
 */
export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth()
  await fetchUser()
})
