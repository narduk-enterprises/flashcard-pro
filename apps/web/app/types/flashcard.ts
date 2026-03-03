export interface Deck {
  id: string
  userId?: string | null
  name: string
  description: string
  createdAt: string
  cardCount?: number
}

export interface Card {
  id: string
  deckId: string
  front: string
  back: string
  createdAt: string
}

export interface Review {
  id: string
  cardId: string
  rating: number
  reviewedAt: string
}
