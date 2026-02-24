CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`refNumber` varchar(50) NOT NULL,
	`name` text NOT NULL,
	`documentType` varchar(100),
	`projectId` int,
	`division` varchar(50),
	`status` varchar(50) DEFAULT 'Draft',
	`description` text,
	`fileUrl` text,
	`dueDate` date,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskCode` varchar(20),
	`title` text NOT NULL,
	`description` text,
	`division` varchar(50),
	`projectId` int,
	`documentId` int,
	`status` varchar(50) DEFAULT 'Pending',
	`priority` varchar(20) DEFAULT 'Medium',
	`assignedToId` int,
	`dueDate` date,
	`sla` varchar(100),
	`frequency` varchar(50),
	`completedAt` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `createdById` int;