/**
 * Protects routes that require auth (e.g. create deck).
 * Redirects to login with returnUrl so we can send the user back after login.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  if (user.value) return
  await fetchUser()
  if (user.value) return
  return navigateTo({
    path: '/login',
    query: { returnUrl: to.fullPath },
  })
})
