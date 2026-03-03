/**
 * Client-side study reminder using the Notification API and localStorage.
 * Sets a daily reminder at the user's chosen hour.
 */
export function useStudyReminder() {
  const STORAGE_KEY = 'flashcard-pro:reminder'
  const reminderEnabled = ref(false)
  const reminderHour = ref(9)
  let timerId: ReturnType<typeof setTimeout> | null = null

  async function requestPermission(): Promise<boolean> {
    if (!import.meta.client) return false
    const hasNotification = typeof Notification !== 'undefined'
    if (!hasNotification) return false
    if (Notification.permission === 'granted') return true
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  async function enableReminder(hour: number) {
    const granted = await requestPermission()
    if (!granted) return false
    reminderHour.value = hour
    reminderEnabled.value = true
    return true
  }

  function disableReminder() {
    reminderEnabled.value = false
    if (timerId) clearTimeout(timerId)
  }

  onMounted(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        reminderEnabled.value = parsed.enabled ?? false
        reminderHour.value = parsed.hour ?? 9
      }
    } catch {
      // ignore
    }

    // Schedule next reminder
    if (reminderEnabled.value && 'Notification' in window && Notification.permission === 'granted') {
      const now = new Date()
      const next = new Date()
      next.setHours(reminderHour.value, 0, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)
      const delay = next.getTime() - now.getTime()
      timerId = setTimeout(() => {
        new Notification('FlashCardPro Reminder', {
          body: 'Time to study your flashcards! 📚',
          icon: '/logo.png',
        })
      }, delay)
    }
  })

  watch([reminderEnabled, reminderHour], () => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: reminderEnabled.value,
        hour: reminderHour.value,
      }))
    }
  })

  return { reminderEnabled, reminderHour, enableReminder, disableReminder }
}
