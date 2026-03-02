export interface Deck {
  id: string
  name: string
  description: string
  createdAt: string
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
