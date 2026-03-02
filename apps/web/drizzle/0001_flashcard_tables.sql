-- FlashCardPro: decks, cards, reviews
CREATE TABLE IF NOT EXISTS `decks` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `cards` (
  `id` text PRIMARY KEY NOT NULL,
  `deck_id` text NOT NULL REFERENCES `decks`(`id`) ON DELETE CASCADE,
  `front` text NOT NULL,
  `back` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` text PRIMARY KEY NOT NULL,
  `card_id` text NOT NULL REFERENCES `cards`(`id`) ON DELETE CASCADE,
  `rating` integer NOT NULL,
  `reviewed_at` text NOT NULL
);
