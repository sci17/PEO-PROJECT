CREATE TABLE `personnel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` varchar(50),
	`name` text NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`division` varchar(50) NOT NULL,
	`position` varchar(100),
	`isDivisionHead` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personnel_id` PRIMARY KEY(`id`)
);
