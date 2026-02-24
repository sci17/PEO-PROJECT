import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** User role: admin has full access, user has limited access */
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Division assignment for role-based access control */
  division: mysqlEnum("division", ["Admin", "Planning", "Construction", "Quality", "Maintenance"]),
  /** Position/title within the division */
  position: varchar("position", { length: 100 }),
  /** Whether the user is a division head */
  isDivisionHead: boolean("isDivisionHead").default(false),
  /** Approval status: pending users cannot access the system until approved by admin */
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** Admin who approved/rejected this user */
  approvedById: int("approvedById"),
  /** Date when the user was approved/rejected */
  approvalDate: timestamp("approvalDate"),
  /** Reason for rejection if applicable */
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table for PEO infrastructure projects
 * Based on FY2025 Fourth Quarterly Report data structure
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  /** Row number from the original report */
  rowNumber: int("rowNumber"),
  /** PEO LBAC category (Roads, Bridges, Public buildings, Other infra projects) */
  category: varchar("category", { length: 100 }),
  /** Full project name */
  projectName: text("projectName").notNull(),
  /** Project ID from the report */
  projectId: varchar("projectId", { length: 100 }),
  /** PPDO Category */
  ppdoCategory: varchar("ppdoCategory", { length: 100 }),
  /** Project description */
  description: text("description"),
  /** Location/Barangay */
  location: text("location"),
  /** Municipality */
  municipality: varchar("municipality", { length: 100 }),
  /** Implementing office */
  implementingOffice: varchar("implementingOffice", { length: 50 }),
  /** Fiscal year */
  fiscalYear: int("fiscalYear"),
  /** Source of fund */
  sourceOfFund: varchar("sourceOfFund", { length: 200 }),
  /** Fund category */
  fundCategory: varchar("fundCategory", { length: 200 }),
  /** Project cost (approved budget) */
  projectCost: decimal("projectCost", { precision: 18, scale: 2 }),
  /** Contract cost */
  contractCost: decimal("contractCost", { precision: 18, scale: 2 }),
  /** Calendar days for completion */
  calendarDays: int("calendarDays"),
  /** Notice to Proceed date */
  ntpDate: date("ntpDate"),
  /** Number of extensions granted */
  extensionCount: int("extensionCount"),
  /** Target completion date */
  targetCompletionDate: date("targetCompletionDate"),
  /** Revised completion date */
  revisedCompletionDate: date("revisedCompletionDate"),
  /** Actual date completed */
  dateCompleted: date("dateCompleted"),
  /** Progress as of December FY 2025 (percentage as decimal, 1 = 100%) */
  progressPercent: decimal("progressPercent", { precision: 5, scale: 2 }),
  /** Mode of procurement */
  procurementMode: varchar("procurementMode", { length: 50 }),
  /** General remarks / status */
  status: varchar("status", { length: 100 }),
  /** Project contractor name */
  contractor: text("contractor"),
  /** Contractor TIN */
  contractorTin: varchar("contractorTin", { length: 50 }),
  /** Reason for status (if applicable) */
  statusReason: text("statusReason"),
  /** User who created this project */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Documents table for tracking project documents, site instructions, NCRs, etc.
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /** Document reference number (e.g., DOC-00081) */
  refNumber: varchar("refNumber", { length: 50 }).notNull(),
  /** Document name/title */
  name: text("name").notNull(),
  /** Document type (Site Instruction, NCR, DED Package, Billing Packet, etc.) */
  documentType: varchar("documentType", { length: 100 }),
  /** Related project ID */
  projectId: int("projectId"),
  /** Division responsible (Admin, Planning, Construction, Quality, Maintenance) */
  division: varchar("division", { length: 50 }),
  /** Document status (Draft, For Review, Routed, Processing, Approved, Open, Closed) */
  status: varchar("status", { length: 50 }).default("Draft"),
  /** Description or notes */
  description: text("description"),
  /** File URL if uploaded */
  fileUrl: text("fileUrl"),
  /** Due date if applicable */
  dueDate: date("dueDate"),
  /** User who created this document */
  createdById: int("createdById"),
  
  // Routing workflow fields
  /** Date document was received by PEO */
  dateReceivedByPEO: date("dateReceivedByPEO"),
  /** Date document was released to Admin */
  dateReleasedToAdmin: date("dateReleasedToAdmin"),
  /** Date document was received from Admin */
  dateReceivedFromAdmin: date("dateReceivedFromAdmin"),
  /** Date document was released to Accounting */
  dateReleasedToAccounting: date("dateReleasedToAccounting"),
  
  // Billing-specific fields
  /** Type of billing (Progress Billing, Final Billing, etc.) */
  billingType: varchar("billingType", { length: 100 }),
  /** Billing percentage (e.g., 30%, 60%, 100%) */
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  /** Contractor ID from contractors table */
  contractorId: int("contractorId"),
  /** Contract amount */
  contractAmount: decimal("contractAmount", { precision: 15, scale: 2 }),
  /** Revised contract amount if applicable */
  revisedContractAmount: decimal("revisedContractAmount", { precision: 15, scale: 2 }),
  /** Period covered by this billing */
  periodCovered: varchar("periodCovered", { length: 100 }),
  /** Project start date */
  dateStarted: date("dateStarted"),
  /** Project completion date */
  completionDate: date("completionDate"),
  
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Tasks table for tracking division tasks and assignments
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  /** Task code (e.g., CON-01, PLN-02) */
  taskCode: varchar("taskCode", { length: 20 }),
  /** Task title */
  title: text("title").notNull(),
  /** Task description */
  description: text("description"),
  /** Division (Admin, Planning, Construction, Quality, Maintenance) */
  division: varchar("division", { length: 50 }),
  /** Related project ID */
  projectId: int("projectId"),
  /** Related document ID */
  documentId: int("documentId"),
  /** Task status (Pending, In Progress, Completed, Overdue) */
  status: varchar("status", { length: 50 }).default("Pending"),
  /** Priority (Low, Medium, High, Urgent) */
  priority: varchar("priority", { length: 20 }).default("Medium"),
  /** Assigned user ID */
  assignedToId: int("assignedToId"),
  /** Due date */
  dueDate: date("dueDate"),
  /** SLA requirement */
  sla: varchar("sla", { length: 100 }),
  /** Frequency (Daily, Weekly, As needed, Per project) */
  frequency: varchar("frequency", { length: 50 }),
  /** Completed date */
  completedAt: timestamp("completedAt"),
  /** User who created this task */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Personnel table for division staff members
 */
export const personnel = mysqlTable("personnel", {
  id: int("id").autoincrement().primaryKey(),
  /** Employee ID or code */
  employeeId: varchar("employeeId", { length: 50 }),
  /** Full name */
  name: text("name").notNull(),
  /** Email address */
  email: varchar("email", { length: 320 }),
  /** Phone number */
  phone: varchar("phone", { length: 20 }),
  /** Division (Admin, Planning, Construction, Quality, Maintenance) */
  division: varchar("division", { length: 50 }).notNull(),
  /** Position/title */
  position: varchar("position", { length: 100 }),
  /** Whether this person is a division head */
  isDivisionHead: boolean("isDivisionHead").default(false),
  /** Whether this person is active */
  isActive: boolean("isActive").default(true),
  /** Linked user account ID (if they have login access) */
  userId: int("userId"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = typeof personnel.$inferInsert;


/**
 * Annual Budget table for 20% Development Fund allocations
 */
export const annualBudgets = mysqlTable("annual_budgets", {
  id: int("id").autoincrement().primaryKey(),
  /** Fiscal year */
  fiscalYear: int("fiscalYear").notNull(),
  /** Total annual budget (20% Development Fund) */
  totalBudget: decimal("totalBudget", { precision: 18, scale: 2 }).notNull(),
  /** Amount already allocated to POW */
  allocatedAmount: decimal("allocatedAmount", { precision: 18, scale: 2 }).default("0"),
  /** Amount remaining for allocation */
  remainingAmount: decimal("remainingAmount", { precision: 18, scale: 2 }),
  /** Budget status (Draft, Approved, Closed) */
  status: varchar("status", { length: 50 }).default("Draft"),
  /** Approval date */
  approvedDate: date("approvedDate"),
  /** Notes/remarks */
  remarks: text("remarks"),
  /** User who created this budget */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnnualBudget = typeof annualBudgets.$inferSelect;
export type InsertAnnualBudget = typeof annualBudgets.$inferInsert;

/**
 * Program of Works (POW) table for project planning
 */
export const programOfWorks = mysqlTable("program_of_works", {
  id: int("id").autoincrement().primaryKey(),
  /** POW reference number (e.g., POW-2026-001) */
  powNumber: varchar("powNumber", { length: 50 }).notNull(),
  /** Project title */
  projectTitle: text("projectTitle").notNull(),
  /** Project description */
  description: text("description"),
  /** Location */
  location: text("location"),
  /** Municipality */
  municipality: varchar("municipality", { length: 100 }),
  /** Category (Roads, Bridges, Public Buildings, Other) */
  category: varchar("category", { length: 100 }),
  /** Linked annual budget ID */
  budgetId: int("budgetId"),
  /** Fiscal year */
  fiscalYear: int("fiscalYear").notNull(),
  /** Estimated project cost (ABC - Approved Budget for Contract) */
  estimatedCost: decimal("estimatedCost", { precision: 18, scale: 2 }).notNull(),
  /** Source of fund */
  sourceOfFund: varchar("sourceOfFund", { length: 200 }).default("20% Development Fund"),
  /** POW Status (Draft, For Review, Approved, For Bidding, Awarded, Cancelled) */
  status: varchar("status", { length: 50 }).default("Draft"),
  /** Division responsible for planning */
  planningDivision: varchar("planningDivision", { length: 50 }).default("Planning"),
  /** Detailed Engineering Design (DED) status */
  dedStatus: varchar("dedStatus", { length: 50 }).default("Not Started"),
  /** DED completion date */
  dedCompletedDate: date("dedCompletedDate"),
  /** Plans and specs ready */
  plansSpecsReady: boolean("plansSpecsReady").default(false),
  /** Target bidding date */
  targetBiddingDate: date("targetBiddingDate"),
  /** Target start date */
  targetStartDate: date("targetStartDate"),
  /** Target completion date */
  targetCompletionDate: date("targetCompletionDate"),
  /** Calendar days for implementation */
  calendarDays: int("calendarDays"),
  /** Linked project ID (after construction starts) */
  projectId: int("projectId"),
  /** Linked bidding ID */
  biddingId: int("biddingId"),
  /** Remarks */
  remarks: text("remarks"),
  /** User who created this POW */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProgramOfWork = typeof programOfWorks.$inferSelect;
export type InsertProgramOfWork = typeof programOfWorks.$inferInsert;

/**
 * Bidding table for procurement tracking
 */
export const biddings = mysqlTable("biddings", {
  id: int("id").autoincrement().primaryKey(),
  /** Bidding reference number */
  biddingNumber: varchar("biddingNumber", { length: 50 }).notNull(),
  /** Linked POW ID */
  powId: int("powId"),
  /** Project title */
  projectTitle: text("projectTitle").notNull(),
  /** Approved Budget for Contract (ABC) */
  abc: decimal("abc", { precision: 18, scale: 2 }).notNull(),
  /** Procurement mode (Public Bidding, Small Value, Shopping, etc.) */
  procurementMode: varchar("procurementMode", { length: 100 }).default("Public Bidding"),
  /** Bidding status */
  status: varchar("status", { length: 50 }).default("Pre-Procurement"),
  /** Pre-procurement conference date */
  preProcurementDate: date("preProcurementDate"),
  /** Advertisement/posting date */
  advertisementDate: date("advertisementDate"),
  /** Pre-bid conference date */
  preBidDate: date("preBidDate"),
  /** Bid submission deadline */
  bidSubmissionDeadline: timestamp("bidSubmissionDeadline"),
  /** Bid opening date */
  bidOpeningDate: date("bidOpeningDate"),
  /** Bid evaluation date */
  bidEvaluationDate: date("bidEvaluationDate"),
  /** Post-qualification date */
  postQualificationDate: date("postQualificationDate"),
  /** BAC resolution date */
  bacResolutionDate: date("bacResolutionDate"),
  /** Notice of Award date */
  noaDate: date("noaDate"),
  /** Contract signing date */
  contractSigningDate: date("contractSigningDate"),
  /** Notice to Proceed date */
  ntpDate: date("ntpDate"),
  /** Winning bidder name */
  winningBidder: text("winningBidder"),
  /** Winning bid amount */
  winningBidAmount: decimal("winningBidAmount", { precision: 18, scale: 2 }),
  /** Contract cost */
  contractCost: decimal("contractCost", { precision: 18, scale: 2 }),
  /** Number of bidders */
  numberOfBidders: int("numberOfBidders"),
  /** Failed bidding count */
  failedBiddingCount: int("failedBiddingCount").default(0),
  /** Reason for failed bidding */
  failedReason: text("failedReason"),
  /** Linked project ID (after award) */
  projectId: int("projectId"),
  /** Remarks */
  remarks: text("remarks"),
  /** User who created this bidding */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bidding = typeof biddings.$inferSelect;
export type InsertBidding = typeof biddings.$inferInsert;


/**
 * Contractors table for tracking bidders and contractors
 */
export const contractors = mysqlTable("contractors", {
  id: int("id").autoincrement().primaryKey(),
  /** Company/contractor name */
  name: text("name").notNull(),
  /** Trade name / DBA */
  tradeName: text("tradeName"),
  /** Tax Identification Number */
  tin: varchar("tin", { length: 50 }),
  /** PhilGEPS registration number */
  philgepsNumber: varchar("philgepsNumber", { length: 50 }),
  /** PCAB license number */
  pcabLicense: varchar("pcabLicense", { length: 50 }),
  /** PCAB category (e.g., AAA, AA, A, B, C, D) */
  pcabCategory: varchar("pcabCategory", { length: 20 }),
  /** PCAB classification (e.g., General Engineering, General Building) */
  pcabClassification: varchar("pcabClassification", { length: 100 }),
  /** License expiry date */
  licenseExpiryDate: date("licenseExpiryDate"),
  /** Business address */
  address: text("address"),
  /** City/Municipality */
  city: varchar("city", { length: 100 }),
  /** Province */
  province: varchar("province", { length: 100 }),
  /** Contact person name */
  contactPerson: varchar("contactPerson", { length: 200 }),
  /** Contact email */
  email: varchar("email", { length: 320 }),
  /** Contact phone */
  phone: varchar("phone", { length: 50 }),
  /** Mobile number */
  mobile: varchar("mobile", { length: 50 }),
  /** Contractor status (Active, Blacklisted, Suspended, Inactive) */
  status: varchar("status", { length: 50 }).default("Active"),
  /** Blacklist reason if applicable */
  blacklistReason: text("blacklistReason"),
  /** Blacklist date */
  blacklistDate: date("blacklistDate"),
  /** Overall performance rating (1-5 scale, calculated average) */
  overallRating: decimal("overallRating", { precision: 3, scale: 2 }),
  /** Total number of contracts awarded */
  totalContracts: int("totalContracts").default(0),
  /** Total contract value */
  totalContractValue: decimal("totalContractValue", { precision: 18, scale: 2 }).default("0"),
  /** Number of completed contracts */
  completedContracts: int("completedContracts").default(0),
  /** Number of ongoing contracts */
  ongoingContracts: int("ongoingContracts").default(0),
  /** Notes/remarks */
  remarks: text("remarks"),
  /** User who created this record */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = typeof contractors.$inferInsert;

/**
 * Contract History table for tracking contractor's past contracts
 */
export const contractHistory = mysqlTable("contract_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Linked contractor ID */
  contractorId: int("contractorId").notNull(),
  /** Linked project ID (if in our system) */
  projectId: int("projectId"),
  /** Linked bidding ID (if in our system) */
  biddingId: int("biddingId"),
  /** Contract reference number */
  contractNumber: varchar("contractNumber", { length: 100 }),
  /** Project/contract title */
  projectTitle: text("projectTitle").notNull(),
  /** Client/agency name */
  clientName: varchar("clientName", { length: 200 }).default("Province of Palawan - PEO"),
  /** Contract amount */
  contractAmount: decimal("contractAmount", { precision: 18, scale: 2 }),
  /** Contract start date */
  startDate: date("startDate"),
  /** Original completion date */
  originalCompletionDate: date("originalCompletionDate"),
  /** Actual completion date */
  actualCompletionDate: date("actualCompletionDate"),
  /** Contract status (Ongoing, Completed, Terminated, Suspended) */
  status: varchar("status", { length: 50 }).default("Ongoing"),
  /** Number of time extensions granted */
  timeExtensions: int("timeExtensions").default(0),
  /** Total extension days */
  extensionDays: int("extensionDays").default(0),
  /** Number of variation orders */
  variationOrders: int("variationOrders").default(0),
  /** Variation order amount */
  variationAmount: decimal("variationAmount", { precision: 18, scale: 2 }).default("0"),
  /** Final contract amount (after variations) */
  finalAmount: decimal("finalAmount", { precision: 18, scale: 2 }),
  /** Performance rating for this contract (1-5) */
  performanceRating: decimal("performanceRating", { precision: 3, scale: 2 }),
  /** Liquidated damages applied */
  liquidatedDamages: decimal("liquidatedDamages", { precision: 18, scale: 2 }).default("0"),
  /** Notes/remarks */
  remarks: text("remarks"),
  /** User who created this record */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractHistory = typeof contractHistory.$inferSelect;
export type InsertContractHistory = typeof contractHistory.$inferInsert;

/**
 * Performance Ratings table for detailed contractor evaluations
 */
export const performanceRatings = mysqlTable("performance_ratings", {
  id: int("id").autoincrement().primaryKey(),
  /** Linked contractor ID */
  contractorId: int("contractorId").notNull(),
  /** Linked contract history ID */
  contractHistoryId: int("contractHistoryId"),
  /** Linked project ID */
  projectId: int("projectId"),
  /** Evaluation period (e.g., "Q1 2026", "Final") */
  evaluationPeriod: varchar("evaluationPeriod", { length: 50 }),
  /** Quality of work rating (1-5) */
  qualityRating: decimal("qualityRating", { precision: 3, scale: 2 }),
  /** Timeliness rating (1-5) */
  timelinessRating: decimal("timelinessRating", { precision: 3, scale: 2 }),
  /** Safety compliance rating (1-5) */
  safetyRating: decimal("safetyRating", { precision: 3, scale: 2 }),
  /** Resource management rating (1-5) */
  resourceRating: decimal("resourceRating", { precision: 3, scale: 2 }),
  /** Communication/coordination rating (1-5) */
  communicationRating: decimal("communicationRating", { precision: 3, scale: 2 }),
  /** Overall rating (calculated average) */
  overallRating: decimal("overallRating", { precision: 3, scale: 2 }),
  /** Evaluator name */
  evaluatorName: varchar("evaluatorName", { length: 200 }),
  /** Evaluator position */
  evaluatorPosition: varchar("evaluatorPosition", { length: 100 }),
  /** Evaluation date */
  evaluationDate: date("evaluationDate"),
  /** Strengths noted */
  strengths: text("strengths"),
  /** Areas for improvement */
  areasForImprovement: text("areasForImprovement"),
  /** Additional comments */
  comments: text("comments"),
  /** User who created this rating */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceRating = typeof performanceRatings.$inferSelect;
export type InsertPerformanceRating = typeof performanceRatings.$inferInsert;


/**
 * Provincial Roads table for Maintenance Division
 * Based on Provincial Road Network inventory data
 */
export const provincialRoads = mysqlTable("provincial_roads", {
  id: int("id").autoincrement().primaryKey(),
  /** Road ID from the inventory */
  roadId: varchar("roadId", { length: 20 }),
  /** Road name */
  roadName: varchar("roadName", { length: 300 }).notNull(),
  /** Municipality where road is located */
  municipality: varchar("municipality", { length: 100 }),
  /** Total length in kilometers */
  lengthKm: decimal("lengthKm", { precision: 10, scale: 3 }),
  /** Concrete surface length in km */
  concreteLengthKm: decimal("concreteLengthKm", { precision: 10, scale: 3 }),
  /** Asphalt surface length in km */
  asphaltLengthKm: decimal("asphaltLengthKm", { precision: 10, scale: 3 }),
  /** Earth surface length in km */
  earthLengthKm: decimal("earthLengthKm", { precision: 10, scale: 3 }),
  /** Gravel surface length in km */
  gravelLengthKm: decimal("gravelLengthKm", { precision: 10, scale: 3 }),
  /** Road condition: Good, Fair, Poor, Bad */
  roadCondition: mysqlEnum("roadCondition", ["Good", "Fair", "Poor", "Bad"]),
  /** Kilometer post reference */
  kilometerPost: varchar("kilometerPost", { length: 100 }),
  /** Length needing vegetation control */
  vegetationControlKm: decimal("vegetationControlKm", { precision: 10, scale: 3 }),
  /** Length needing rehabilitation */
  rehabNeededKm: decimal("rehabNeededKm", { precision: 10, scale: 3 }),
  /** Notes/remarks */
  remarks: text("remarks"),
  /** Region: North, South, Islands */
  region: varchar("region", { length: 50 }),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProvincialRoad = typeof provincialRoads.$inferSelect;
export type InsertProvincialRoad = typeof provincialRoads.$inferInsert;

/**
 * Maintenance Equipment table
 * Track equipment available for road maintenance
 */
export const maintenanceEquipment = mysqlTable("maintenance_equipment", {
  id: int("id").autoincrement().primaryKey(),
  /** Equipment name */
  name: varchar("name", { length: 200 }).notNull(),
  /** Equipment type: Heavy Equipment, Vehicle, Tool */
  equipmentType: mysqlEnum("equipmentType", ["Heavy Equipment", "Vehicle", "Tool", "Other"]),
  /** Equipment code/ID */
  equipmentCode: varchar("equipmentCode", { length: 50 }),
  /** Model/make */
  model: varchar("model", { length: 100 }),
  /** Plate number (for vehicles) */
  plateNumber: varchar("plateNumber", { length: 20 }),
  /** Current status */
  status: mysqlEnum("status", ["Available", "In Use", "Under Maintenance", "Out of Service"]).default("Available"),
  /** Current location/assignment */
  currentLocation: varchar("currentLocation", { length: 200 }),
  /** Operator assigned */
  operatorName: varchar("operatorName", { length: 200 }),
  /** Last maintenance date */
  lastMaintenanceDate: date("lastMaintenanceDate"),
  /** Next scheduled maintenance */
  nextMaintenanceDate: date("nextMaintenanceDate"),
  /** Notes */
  notes: text("notes"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceEquipment = typeof maintenanceEquipment.$inferSelect;
export type InsertMaintenanceEquipment = typeof maintenanceEquipment.$inferInsert;

/**
 * Maintenance Schedule table
 * Schedule maintenance activities for roads
 */
export const maintenanceSchedules = mysqlTable("maintenance_schedules", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to provincial road */
  roadId: int("roadId"),
  /** Schedule title/description */
  title: varchar("title", { length: 300 }).notNull(),
  /** Type of maintenance */
  maintenanceType: mysqlEnum("maintenanceType", [
    "Vegetation Control",
    "Pothole Patching",
    "Grading",
    "Drainage Cleaning",
    "Road Rehabilitation",
    "Emergency Repair",
    "Routine Inspection",
    "Other"
  ]),
  /** Priority level */
  priority: mysqlEnum("priority", ["Low", "Medium", "High", "Urgent"]).default("Medium"),
  /** Scheduled start date */
  scheduledStartDate: date("scheduledStartDate"),
  /** Scheduled end date */
  scheduledEndDate: date("scheduledEndDate"),
  /** Actual start date */
  actualStartDate: date("actualStartDate"),
  /** Actual end date */
  actualEndDate: date("actualEndDate"),
  /** Status */
  status: mysqlEnum("scheduleStatus", ["Scheduled", "In Progress", "Completed", "Cancelled", "Postponed"]).default("Scheduled"),
  /** Estimated cost */
  estimatedCost: decimal("estimatedCost", { precision: 15, scale: 2 }),
  /** Actual cost */
  actualCost: decimal("actualCost", { precision: 15, scale: 2 }),
  /** Assigned personnel/team */
  assignedTeam: varchar("assignedTeam", { length: 200 }),
  /** Kilometer start */
  kmStart: decimal("kmStart", { precision: 10, scale: 3 }),
  /** Kilometer end */
  kmEnd: decimal("kmEnd", { precision: 10, scale: 3 }),
  /** Notes/remarks */
  notes: text("notes"),
  /** User who created this schedule */
  createdById: int("createdById"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

/**
 * Equipment Assignment table
 * Track equipment assignments to maintenance schedules
 */
export const equipmentAssignments = mysqlTable("equipment_assignments", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to maintenance schedule */
  scheduleId: int("scheduleId"),
  /** Reference to equipment */
  equipmentId: int("equipmentId"),
  /** Assignment start date */
  startDate: date("startDate"),
  /** Assignment end date */
  endDate: date("endDate"),
  /** Assigned operator */
  operatorName: varchar("operatorName", { length: 200 }),
  /** Hours used */
  hoursUsed: decimal("hoursUsed", { precision: 10, scale: 2 }),
  /** Fuel consumed (liters) */
  fuelConsumed: decimal("fuelConsumed", { precision: 10, scale: 2 }),
  /** Status */
  status: mysqlEnum("assignmentStatus", ["Assigned", "Active", "Completed", "Returned"]).default("Assigned"),
  /** Notes */
  notes: text("notes"),
  /** Record timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EquipmentAssignment = typeof equipmentAssignments.$inferSelect;
export type InsertEquipmentAssignment = typeof equipmentAssignments.$inferInsert;
