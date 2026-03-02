-- Add deck ownership (nullable for existing decks; new decks require auth)
ALTER TABLE `decks` ADD COLUMN `user_id` text;
