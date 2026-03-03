export interface StudyStats {
  totalDecks: number
  totalCards: number
  totalReviews: number
  averageRating: number
}

export function useStudyStats() {
  const { data: stats, pending, error, refresh } = useFetch<StudyStats>('/api/stats', {
    default: () => ({ totalDecks: 0, totalCards: 0, totalReviews: 0, averageRating: 0 }),
  })
  return { stats, pending, error, refresh }
}
