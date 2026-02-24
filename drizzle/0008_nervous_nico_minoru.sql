CREATE TABLE `equipment_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int,
	`equipmentId` int,
	`startDate` date,
	`endDate` date,
	`operatorName` varchar(200),
	`hoursUsed` decimal(10,2),
	`fuelConsumed` decimal(10,2),
	`assignmentStatus` enum('Assigned','Active','Completed','Returned') DEFAULT 'Assigned',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`equipmentType` enum('Heavy Equipment','Vehicle','Tool','Other'),
	`equipmentCode` varchar(50),
	`model` varchar(100),
	`plateNumber` varchar(20),
	`status` enum('Available','In Use','Under Maintenance','Out of Service') DEFAULT 'Available',
	`currentLocation` varchar(200),
	`operatorName` varchar(200),
	`lastMaintenanceDate` date,
	`nextMaintenanceDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadId` int,
	`title` varchar(300) NOT NULL,
	`maintenanceType` enum('Vegetation Control','Pothole Patching','Grading','Drainage Cleaning','Road Rehabilitation','Emergency Repair','Routine Inspection','Other'),
	`priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
	`scheduledStartDate` date,
	`scheduledEndDate` date,
	`actualStartDate` date,
	`actualEndDate` date,
	`scheduleStatus` enum('Scheduled','In Progress','Completed','Cancelled','Postponed') DEFAULT 'Scheduled',
	`estimatedCost` decimal(15,2),
	`actualCost` decimal(15,2),
	`assignedTeam` varchar(200),
	`kmStart` decimal(10,3),
	`kmEnd` decimal(10,3),
	`notes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provincial_roads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadId` varchar(20),
	`roadName` varchar(300) NOT NULL,
	`municipality` varchar(100),
	`lengthKm` decimal(10,3),
	`concreteLengthKm` decimal(10,3),
	`asphaltLengthKm` decimal(10,3),
	`earthLengthKm` decimal(10,3),
	`gravelLengthKm` decimal(10,3),
	`roadCondition` enum('Good','Fair','Poor','Bad'),
	`kilometerPost` varchar(100),
	`vegetationControlKm` decimal(10,3),
	`rehabNeededKm` decimal(10,3),
	`remarks` text,
	`region` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provincial_roads_id` PRIMARY KEY(`id`)
);
