-- Add tags and visibility to decks, favorites and collaborators tables
ALTER TABLE `decks` ADD COLUMN `tags` text NOT NULL DEFAULT '';
ALTER TABLE `decks` ADD COLUMN `is_public` integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `deck_id` text NOT NULL REFERENCES `decks`(`id`) ON DELETE CASCADE,
  `created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `collaborators` (
  `id` text PRIMARY KEY NOT NULL,
  `deck_id` text NOT NULL REFERENCES `decks`(`id`) ON DELETE CASCADE,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `created_at` text NOT NULL
);
