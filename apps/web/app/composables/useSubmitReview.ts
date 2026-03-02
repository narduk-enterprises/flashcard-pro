export function useSubmitReview() {
  async function submitReview(body: { cardId: string; rating: number }): Promise<void> {
    await $fetch('/api/reviews', {
      method: 'POST',
      body,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
  }
  return { submitReview }
}
