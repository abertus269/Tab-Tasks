CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `status` text DEFAULT 'todo' NOT NULL;
--> statement-breakpoint
UPDATE `tasks` SET `status` = 'done' WHERE `completed` = 1;
--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `completed`;
