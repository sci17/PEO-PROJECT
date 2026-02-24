ALTER TABLE `users` ADD `approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `approvedById` int;--> statement-breakpoint
ALTER TABLE `users` ADD `approvalDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `rejectionReason` text;