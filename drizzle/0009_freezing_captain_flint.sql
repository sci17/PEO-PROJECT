ALTER TABLE `documents` ADD `dateReceivedByPEO` date;--> statement-breakpoint
ALTER TABLE `documents` ADD `dateReleasedToAdmin` date;--> statement-breakpoint
ALTER TABLE `documents` ADD `dateReceivedFromAdmin` date;--> statement-breakpoint
ALTER TABLE `documents` ADD `dateReleasedToAccounting` date;--> statement-breakpoint
ALTER TABLE `documents` ADD `billingType` varchar(100);--> statement-breakpoint
ALTER TABLE `documents` ADD `percentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `documents` ADD `contractorId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `contractAmount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `documents` ADD `revisedContractAmount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `documents` ADD `periodCovered` varchar(100);--> statement-breakpoint
ALTER TABLE `documents` ADD `dateStarted` date;--> statement-breakpoint
ALTER TABLE `documents` ADD `completionDate` date;