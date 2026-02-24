ALTER TABLE `users` ADD `division` enum('Admin','Planning','Construction','Quality','Maintenance');--> statement-breakpoint
ALTER TABLE `users` ADD `position` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `isDivisionHead` boolean DEFAULT false;