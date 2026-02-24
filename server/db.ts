import { eq, like, or, desc, asc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, Project } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== PROJECT QUERIES ====================

export type ProjectFilters = {
  search?: string;
  category?: string;
  municipality?: string;
  status?: string;
  fiscalYear?: number;
  sortBy?: 'name' | 'amount' | 'category' | 'year' | 'municipality';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export async function getProjects(filters: ProjectFilters = {}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get projects: database not available");
    return { projects: [], total: 0, page: 1, totalPages: 0 };
  }

  const {
    search,
    category,
    municipality,
    status,
    fiscalYear,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 50,
  } = filters;

  // Build where conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(projects.projectName, `%${search}%`),
        like(projects.location, `%${search}%`),
        like(projects.contractor, `%${search}%`),
        like(projects.projectId, `%${search}%`)
      )
    );
  }
  
  if (category) {
    conditions.push(eq(projects.category, category));
  }
  
  if (municipality) {
    conditions.push(eq(projects.municipality, municipality));
  }
  
  if (status) {
    conditions.push(eq(projects.status, status));
  }
  
  if (fiscalYear) {
    conditions.push(eq(projects.fiscalYear, fiscalYear));
  }

  // Build order by
  let orderByColumn;
  switch (sortBy) {
    case 'amount':
      orderByColumn = projects.projectCost;
      break;
    case 'category':
      orderByColumn = projects.category;
      break;
    case 'year':
      orderByColumn = projects.fiscalYear;
      break;
    case 'municipality':
      orderByColumn = projects.municipality;
      break;
    default:
      orderByColumn = projects.projectName;
  }

  const orderFn = sortOrder === 'desc' ? desc : asc;

  // Get total count
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(whereClause);
  
  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Get paginated results
  let query = db
    .select()
    .from(projects)
    .where(whereClause)
    .orderBy(orderFn(orderByColumn))
    .limit(limit)
    .offset(offset);

  const result = await query;

  return {
    projects: result,
    total,
    page,
    totalPages,
  };
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get project: database not available");
    return undefined;
  }

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectCategories() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ category: projects.category })
    .from(projects)
    .where(sql`${projects.category} IS NOT NULL`);
  
  return result.map(r => r.category).filter(Boolean) as string[];
}

export async function getProjectMunicipalities() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ municipality: projects.municipality })
    .from(projects)
    .where(sql`${projects.municipality} IS NOT NULL`)
    .orderBy(asc(projects.municipality));
  
  return result.map(r => r.municipality).filter(Boolean) as string[];
}

export async function getProjectStatuses() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ status: projects.status })
    .from(projects)
    .where(sql`${projects.status} IS NOT NULL`);
  
  return result.map(r => r.status).filter(Boolean) as string[];
}

export async function getProjectYears() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ fiscalYear: projects.fiscalYear })
    .from(projects)
    .where(sql`${projects.fiscalYear} IS NOT NULL`)
    .orderBy(desc(projects.fiscalYear));
  
  return result.map(r => r.fiscalYear).filter(Boolean) as number[];
}

export async function getProjectStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    totalCost: sql<number>`COALESCE(SUM(projectCost), 0)`,
    completed: sql<number>`SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END)`,
    ongoing: sql<number>`SUM(CASE WHEN status = 'On going' THEN 1 ELSE 0 END)`,
  }).from(projects);

  const categoryStats = await db
    .select({
      category: projects.category,
      count: sql<number>`count(*)`,
      totalCost: sql<number>`COALESCE(SUM(projectCost), 0)`,
    })
    .from(projects)
    .groupBy(projects.category);

  return {
    total: Number(stats.total),
    totalCost: Number(stats.totalCost),
    completed: Number(stats.completed),
    ongoing: Number(stats.ongoing),
    byCategory: categoryStats.map(c => ({
      category: c.category,
      count: Number(c.count),
      totalCost: Number(c.totalCost),
    })),
  };
}


// ==================== PROJECT CRUD ====================

export async function createProject(data: {
  projectName: string;
  category?: string;
  projectId?: string;
  description?: string;
  location?: string;
  municipality?: string;
  fiscalYear?: number;
  projectCost?: string;
  contractor?: string;
  status?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values({
    projectName: data.projectName,
    category: data.category || null,
    projectId: data.projectId || null,
    description: data.description || null,
    location: data.location || null,
    municipality: data.municipality || null,
    fiscalYear: data.fiscalYear || new Date().getFullYear(),
    projectCost: data.projectCost || null,
    contractor: data.contractor || null,
    status: data.status || "Not yet started",
    createdById: data.createdById || null,
  });

  return { id: result[0].insertId };
}

export async function updateProject(id: number, data: Partial<{
  projectName: string;
  category: string;
  projectId: string;
  description: string;
  location: string;
  municipality: string;
  fiscalYear: number;
  projectCost: string;
  contractor: string;
  status: string;
  progressPercent: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(data).where(eq(projects.id, id));
  return { success: true };
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(eq(projects.id, id));
  return { success: true };
}

// ==================== DOCUMENT QUERIES & CRUD ====================

import { documents, InsertDocument, tasks, InsertTask } from "../drizzle/schema";

export type DocumentFilters = {
  search?: string;
  division?: string;
  status?: string;
  projectId?: number;
  page?: number;
  limit?: number;
};

export async function getDocuments(filters: DocumentFilters = {}) {
  const db = await getDb();
  if (!db) {
    return { documents: [], total: 0, page: 1, totalPages: 0 };
  }

  const {
    search,
    division,
    status,
    projectId,
    page = 1,
    limit = 50,
  } = filters;

  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(documents.name, `%${search}%`),
        like(documents.refNumber, `%${search}%`),
        like(documents.description, `%${search}%`)
      )
    );
  }
  
  if (division) {
    conditions.push(eq(documents.division, division));
  }
  
  if (status) {
    conditions.push(eq(documents.status, status));
  }
  
  if (projectId) {
    conditions.push(eq(documents.projectId, projectId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(whereClause);
  
  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(documents)
    .where(whereClause)
    .orderBy(desc(documents.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    documents: result,
    total,
    page,
    totalPages,
  };
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDocument(data: {
  name: string;
  refNumber?: string;
  documentType?: string;
  projectId?: number;
  division?: string;
  status?: string;
  description?: string;
  dueDate?: Date | null;
  createdById?: number;
  // Routing fields
  dateReceivedByPEO?: Date | null;
  dateReleasedToAdmin?: Date | null;
  dateReceivedFromAdmin?: Date | null;
  dateReleasedToAccounting?: Date | null;
  // Billing fields
  billingType?: string | null;
  percentage?: string | null;
  contractorId?: number | null;
  contractAmount?: string | null;
  revisedContractAmount?: string | null;
  periodCovered?: string | null;
  dateStarted?: Date | null;
  completionDate?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate ref number if not provided
  const refNumber = data.refNumber || `DOC-${Date.now().toString().slice(-5)}`;

  const result = await db.insert(documents).values({
    name: data.name,
    refNumber,
    documentType: data.documentType || null,
    projectId: data.projectId || null,
    division: data.division || null,
    status: data.status || "Draft",
    description: data.description || null,
    dueDate: data.dueDate || null,
    createdById: data.createdById || null,
    // Routing fields
    dateReceivedByPEO: data.dateReceivedByPEO || null,
    dateReleasedToAdmin: data.dateReleasedToAdmin || null,
    dateReceivedFromAdmin: data.dateReceivedFromAdmin || null,
    dateReleasedToAccounting: data.dateReleasedToAccounting || null,
    // Billing fields
    billingType: data.billingType || null,
    percentage: data.percentage || null,
    contractorId: data.contractorId || null,
    contractAmount: data.contractAmount || null,
    revisedContractAmount: data.revisedContractAmount || null,
    periodCovered: data.periodCovered || null,
    dateStarted: data.dateStarted || null,
    completionDate: data.completionDate || null,
  });

  return { id: result[0].insertId, refNumber };
}

export async function updateDocument(id: number, data: Partial<{
  name: string;
  documentType: string;
  division: string;
  status: string;
  description: string;
  dueDate: Date | null;
  // Routing fields
  dateReceivedByPEO: Date | null;
  dateReleasedToAdmin: Date | null;
  dateReceivedFromAdmin: Date | null;
  dateReleasedToAccounting: Date | null;
  // Billing fields
  billingType: string | null;
  percentage: string | null;
  contractorId: number | null;
  contractAmount: string | null;
  revisedContractAmount: string | null;
  periodCovered: string | null;
  dateStarted: Date | null;
  completionDate: Date | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(documents).set(data).where(eq(documents.id, id));
  return { success: true };
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documents).where(eq(documents.id, id));
  return { success: true };
}

export async function getDocumentStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    forReview: sql<number>`SUM(CASE WHEN status = 'For Review' THEN 1 ELSE 0 END)`,
    routed: sql<number>`SUM(CASE WHEN status = 'Routed' THEN 1 ELSE 0 END)`,
    open: sql<number>`SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END)`,
  }).from(documents);

  return {
    total: Number(stats.total),
    forReview: Number(stats.forReview),
    routed: Number(stats.routed),
    open: Number(stats.open),
  };
}

// ==================== TASK QUERIES & CRUD ====================

export type TaskFilters = {
  search?: string;
  division?: string;
  status?: string;
  priority?: string;
  projectId?: number;
  assignedToId?: number;
  page?: number;
  limit?: number;
};

export async function getTasks(filters: TaskFilters = {}) {
  const db = await getDb();
  if (!db) {
    return { tasks: [], total: 0, page: 1, totalPages: 0 };
  }

  const {
    search,
    division,
    status,
    priority,
    projectId,
    assignedToId,
    page = 1,
    limit = 50,
  } = filters;

  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(tasks.title, `%${search}%`),
        like(tasks.taskCode, `%${search}%`),
        like(tasks.description, `%${search}%`)
      )
    );
  }
  
  if (division) {
    conditions.push(eq(tasks.division, division));
  }
  
  if (status) {
    conditions.push(eq(tasks.status, status));
  }
  
  if (priority) {
    conditions.push(eq(tasks.priority, priority));
  }
  
  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  
  if (assignedToId) {
    conditions.push(eq(tasks.assignedToId, assignedToId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(whereClause);
  
  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    tasks: result,
    total,
    page,
    totalPages,
  };
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTask(data: {
  title: string;
  taskCode?: string;
  description?: string;
  division?: string;
  projectId?: number;
  documentId?: number;
  status?: string;
  priority?: string;
  assignedToId?: number;
  dueDate?: Date | null;
  sla?: string;
  frequency?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate task code if not provided
  const divisionPrefix = data.division ? data.division.substring(0, 3).toUpperCase() : "TSK";
  const taskCode = data.taskCode || `${divisionPrefix}-${Date.now().toString().slice(-4)}`;

  const result = await db.insert(tasks).values({
    title: data.title,
    taskCode,
    description: data.description || null,
    division: data.division || null,
    projectId: data.projectId || null,
    documentId: data.documentId || null,
    status: data.status || "Pending",
    priority: data.priority || "Medium",
    assignedToId: data.assignedToId || null,
    dueDate: data.dueDate || null,
    sla: data.sla || null,
    frequency: data.frequency || null,
    createdById: data.createdById || null,
  });

  return { id: result[0].insertId, taskCode };
}

export async function updateTask(id: number, data: Partial<{
  title: string;
  description: string;
  division: string;
  status: string;
  priority: string;
  assignedToId: number;
  dueDate: Date | null;
  completedAt: Date | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If status is being set to Completed, also set completedAt
  if (data.status === "Completed" && !data.completedAt) {
    data.completedAt = new Date();
  }

  await db.update(tasks).set(data).where(eq(tasks.id, id));
  return { success: true };
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tasks).where(eq(tasks.id, id));
  return { success: true };
}

export async function getTaskStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END)`,
    inProgress: sql<number>`SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END)`,
    completed: sql<number>`SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END)`,
    overdue: sql<number>`SUM(CASE WHEN status != 'Completed' AND dueDate < CURDATE() THEN 1 ELSE 0 END)`,
  }).from(tasks);

  return {
    total: Number(stats.total),
    pending: Number(stats.pending),
    inProgress: Number(stats.inProgress),
    completed: Number(stats.completed),
    overdue: Number(stats.overdue),
  };
}


// ==================== PERSONNEL QUERIES & CRUD ====================

import { personnel, InsertPersonnel } from "../drizzle/schema";

export type PersonnelFilters = {
  search?: string;
  division?: string;
  isActive?: boolean;
  isDivisionHead?: boolean;
  page?: number;
  limit?: number;
};

export async function getPersonnel(filters: PersonnelFilters = {}) {
  const db = await getDb();
  if (!db) {
    return { personnel: [], total: 0, page: 1, totalPages: 0 };
  }

  const {
    search,
    division,
    isActive,
    isDivisionHead,
    page = 1,
    limit = 50,
  } = filters;

  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(personnel.name, `%${search}%`),
        like(personnel.employeeId, `%${search}%`),
        like(personnel.email, `%${search}%`),
        like(personnel.position, `%${search}%`)
      )
    );
  }
  
  if (division) {
    conditions.push(eq(personnel.division, division));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(personnel.isActive, isActive));
  }
  
  if (isDivisionHead !== undefined) {
    conditions.push(eq(personnel.isDivisionHead, isDivisionHead));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(personnel)
    .where(whereClause);
  
  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(personnel)
    .where(whereClause)
    .orderBy(asc(personnel.name))
    .limit(limit)
    .offset(offset);

  return {
    personnel: result,
    total,
    page,
    totalPages,
  };
}

export async function getPersonnelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(personnel).where(eq(personnel.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPersonnelByDivision(division: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(personnel)
    .where(and(eq(personnel.division, division), eq(personnel.isActive, true)))
    .orderBy(asc(personnel.name));

  return result;
}

export async function createPersonnel(data: {
  name: string;
  employeeId?: string;
  email?: string;
  phone?: string;
  division: string;
  position?: string;
  isDivisionHead?: boolean;
  isActive?: boolean;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(personnel).values({
    name: data.name,
    employeeId: data.employeeId || null,
    email: data.email || null,
    phone: data.phone || null,
    division: data.division,
    position: data.position || null,
    isDivisionHead: data.isDivisionHead || false,
    isActive: data.isActive !== false,
    userId: data.userId || null,
  });

  return { id: result[0].insertId };
}

export async function updatePersonnel(id: number, data: Partial<{
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  division: string;
  position: string;
  isDivisionHead: boolean;
  isActive: boolean;
  userId: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(personnel).set(data).where(eq(personnel.id, id));
  return { success: true };
}

export async function deletePersonnel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(personnel).where(eq(personnel.id, id));
  return { success: true };
}

export async function getPersonnelStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END)`,
    divisionHeads: sql<number>`SUM(CASE WHEN isDivisionHead = 1 THEN 1 ELSE 0 END)`,
  }).from(personnel);

  const byDivision = await db
    .select({
      division: personnel.division,
      count: sql<number>`count(*)`,
    })
    .from(personnel)
    .where(eq(personnel.isActive, true))
    .groupBy(personnel.division);

  return {
    total: Number(stats.total),
    active: Number(stats.active),
    divisionHeads: Number(stats.divisionHeads),
    byDivision: byDivision.map(d => ({
      division: d.division,
      count: Number(d.count),
    })),
  };
}


// ==================== ANNUAL BUDGET QUERIES & CRUD ====================

import { annualBudgets, InsertAnnualBudget, programOfWorks, InsertProgramOfWork, biddings, InsertBidding } from "../drizzle/schema";

export type BudgetFilters = {
  fiscalYear?: number;
  status?: string;
  sortBy?: 'year' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
};

export async function getAnnualBudgets(filters: BudgetFilters = {}) {
  const db = await getDb();
  if (!db) return [];

  const { fiscalYear, status, sortBy = 'year', sortOrder = 'desc' } = filters;

  const conditions = [];
  if (fiscalYear) conditions.push(eq(annualBudgets.fiscalYear, fiscalYear));
  if (status) conditions.push(eq(annualBudgets.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderByColumn;
  switch (sortBy) {
    case 'amount':
      orderByColumn = annualBudgets.totalBudget;
      break;
    case 'status':
      orderByColumn = annualBudgets.status;
      break;
    default:
      orderByColumn = annualBudgets.fiscalYear;
  }

  const orderFn = sortOrder === 'desc' ? desc : asc;

  return await db
    .select()
    .from(annualBudgets)
    .where(whereClause)
    .orderBy(orderFn(orderByColumn));
}

export async function getAnnualBudgetById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(annualBudgets).where(eq(annualBudgets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAnnualBudgetByYear(fiscalYear: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(annualBudgets).where(eq(annualBudgets.fiscalYear, fiscalYear)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnnualBudget(data: {
  fiscalYear: number;
  totalBudget: string;
  status?: string;
  remarks?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(annualBudgets).values({
    fiscalYear: data.fiscalYear,
    totalBudget: data.totalBudget,
    allocatedAmount: "0",
    remainingAmount: data.totalBudget,
    status: data.status || "Draft",
    remarks: data.remarks || null,
    createdById: data.createdById || null,
  });

  return { id: result[0].insertId };
}

export async function updateAnnualBudget(id: number, data: Partial<{
  totalBudget: string;
  allocatedAmount: string;
  remainingAmount: string;
  status: string;
  approvedDate: Date | null;
  remarks: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(annualBudgets).set(data).where(eq(annualBudgets.id, id));
  return { success: true };
}

export async function deleteAnnualBudget(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(annualBudgets).where(eq(annualBudgets.id, id));
  return { success: true };
}

export async function getBudgetStats() {
  const db = await getDb();
  if (!db) return null;

  const currentYear = new Date().getFullYear();
  
  const [stats] = await db.select({
    totalBudgets: sql<number>`count(*)`,
    totalAllocated: sql<number>`COALESCE(SUM(allocatedAmount), 0)`,
    totalRemaining: sql<number>`COALESCE(SUM(remainingAmount), 0)`,
  }).from(annualBudgets);

  const currentBudget = await getAnnualBudgetByYear(currentYear);

  return {
    totalBudgets: Number(stats.totalBudgets),
    totalAllocated: Number(stats.totalAllocated),
    totalRemaining: Number(stats.totalRemaining),
    currentYear,
    currentBudget,
  };
}

// ==================== PROGRAM OF WORKS (POW) QUERIES & CRUD ====================

export type POWFilters = {
  search?: string;
  fiscalYear?: number;
  status?: string;
  category?: string;
  budgetId?: number;
  sortBy?: 'title' | 'cost' | 'status' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export async function getProgramOfWorks(filters: POWFilters = {}) {
  const db = await getDb();
  if (!db) return { pows: [], total: 0, page: 1, totalPages: 0 };

  const {
    search,
    fiscalYear,
    status,
    category,
    budgetId,
    sortBy = 'date',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = filters;

  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(programOfWorks.projectTitle, `%${search}%`),
        like(programOfWorks.location, `%${search}%`),
        like(programOfWorks.powNumber, `%${search}%`)
      )
    );
  }
  if (fiscalYear) conditions.push(eq(programOfWorks.fiscalYear, fiscalYear));
  if (status) conditions.push(eq(programOfWorks.status, status));
  if (category) conditions.push(eq(programOfWorks.category, category));
  if (budgetId) conditions.push(eq(programOfWorks.budgetId, budgetId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderByColumn;
  switch (sortBy) {
    case 'title':
      orderByColumn = programOfWorks.projectTitle;
      break;
    case 'cost':
      orderByColumn = programOfWorks.estimatedCost;
      break;
    case 'status':
      orderByColumn = programOfWorks.status;
      break;
    default:
      orderByColumn = programOfWorks.createdAt;
  }

  const orderFn = sortOrder === 'desc' ? desc : asc;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(programOfWorks)
    .where(whereClause);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(programOfWorks)
    .where(whereClause)
    .orderBy(orderFn(orderByColumn))
    .limit(limit)
    .offset(offset);

  return { pows: result, total, page, totalPages };
}

export async function getPOWById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(programOfWorks).where(eq(programOfWorks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function generatePOWNumber(fiscalYear: number) {
  const db = await getDb();
  if (!db) return `POW-${fiscalYear}-001`;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(programOfWorks)
    .where(eq(programOfWorks.fiscalYear, fiscalYear));

  const count = Number(result?.count ?? 0) + 1;
  return `POW-${fiscalYear}-${String(count).padStart(3, '0')}`;
}

export async function createPOW(data: {
  projectTitle: string;
  description?: string;
  location?: string;
  municipality?: string;
  category?: string;
  budgetId?: number;
  fiscalYear: number;
  estimatedCost: string;
  sourceOfFund?: string;
  targetBiddingDate?: Date | null;
  targetStartDate?: Date | null;
  targetCompletionDate?: Date | null;
  calendarDays?: number;
  remarks?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const powNumber = await generatePOWNumber(data.fiscalYear);

  const result = await db.insert(programOfWorks).values({
    powNumber,
    projectTitle: data.projectTitle,
    description: data.description || null,
    location: data.location || null,
    municipality: data.municipality || null,
    category: data.category || null,
    budgetId: data.budgetId || null,
    fiscalYear: data.fiscalYear,
    estimatedCost: data.estimatedCost,
    sourceOfFund: data.sourceOfFund || "20% Development Fund",
    status: "Draft",
    dedStatus: "Not Started",
    targetBiddingDate: data.targetBiddingDate || null,
    targetStartDate: data.targetStartDate || null,
    targetCompletionDate: data.targetCompletionDate || null,
    calendarDays: data.calendarDays || null,
    remarks: data.remarks || null,
    createdById: data.createdById || null,
  });

  // Update budget allocated amount if budgetId is provided
  if (data.budgetId) {
    const budget = await getAnnualBudgetById(data.budgetId);
    if (budget) {
      const newAllocated = Number(budget.allocatedAmount || 0) + Number(data.estimatedCost);
      const newRemaining = Number(budget.totalBudget) - newAllocated;
      await updateAnnualBudget(data.budgetId, {
        allocatedAmount: String(newAllocated),
        remainingAmount: String(newRemaining),
      });
    }
  }

  return { id: result[0].insertId, powNumber };
}

export async function updatePOW(id: number, data: Partial<{
  projectTitle: string;
  description: string;
  location: string;
  municipality: string;
  category: string;
  estimatedCost: string;
  status: string;
  dedStatus: string;
  dedCompletedDate: Date | null;
  plansSpecsReady: boolean;
  targetBiddingDate: Date | null;
  targetStartDate: Date | null;
  targetCompletionDate: Date | null;
  calendarDays: number;
  projectId: number;
  biddingId: number;
  remarks: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(programOfWorks).set(data).where(eq(programOfWorks.id, id));
  return { success: true };
}

export async function deletePOW(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get POW to update budget
  const pow = await getPOWById(id);
  if (pow && pow.budgetId) {
    const budget = await getAnnualBudgetById(pow.budgetId);
    if (budget) {
      const newAllocated = Math.max(0, Number(budget.allocatedAmount || 0) - Number(pow.estimatedCost));
      const newRemaining = Number(budget.totalBudget) - newAllocated;
      await updateAnnualBudget(pow.budgetId, {
        allocatedAmount: String(newAllocated),
        remainingAmount: String(newRemaining),
      });
    }
  }

  await db.delete(programOfWorks).where(eq(programOfWorks.id, id));
  return { success: true };
}

export async function getPOWStats(filters?: { fiscalYear?: number }) {
  const db = await getDb();
  if (!db) return null;

  const fiscalYear = filters?.fiscalYear;
  
  // Build query - only add where clause if fiscalYear is provided
  const query = db.select({
    total: sql<number>`count(*)`,
    totalCost: sql<number>`COALESCE(SUM(estimatedCost), 0)`,
    draft: sql<number>`SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END)`,
    forReview: sql<number>`SUM(CASE WHEN status = 'For Review' THEN 1 ELSE 0 END)`,
    approved: sql<number>`SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END)`,
    forBidding: sql<number>`SUM(CASE WHEN status = 'For Bidding' THEN 1 ELSE 0 END)`,
    awarded: sql<number>`SUM(CASE WHEN status = 'Awarded' THEN 1 ELSE 0 END)`,
  }).from(programOfWorks);
  
  const [stats] = fiscalYear 
    ? await query.where(eq(programOfWorks.fiscalYear, fiscalYear))
    : await query;

  return {
    total: Number(stats.total),
    totalCost: Number(stats.totalCost),
    draft: Number(stats.draft),
    forReview: Number(stats.forReview),
    approved: Number(stats.approved),
    forBidding: Number(stats.forBidding),
    awarded: Number(stats.awarded),
  };
}

// ==================== BIDDING QUERIES & CRUD ====================

export type BiddingFilters = {
  search?: string;
  status?: string;
  procurementMode?: string;
  powId?: number;
  sortBy?: 'title' | 'abc' | 'status' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export async function getBiddings(filters: BiddingFilters = {}) {
  const db = await getDb();
  if (!db) return { biddings: [], total: 0, page: 1, totalPages: 0 };

  const {
    search,
    status,
    procurementMode,
    powId,
    sortBy = 'date',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = filters;

  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(biddings.projectTitle, `%${search}%`),
        like(biddings.biddingNumber, `%${search}%`),
        like(biddings.winningBidder, `%${search}%`)
      )
    );
  }
  if (status) conditions.push(eq(biddings.status, status));
  if (procurementMode) conditions.push(eq(biddings.procurementMode, procurementMode));
  if (powId) conditions.push(eq(biddings.powId, powId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderByColumn;
  switch (sortBy) {
    case 'title':
      orderByColumn = biddings.projectTitle;
      break;
    case 'abc':
      orderByColumn = biddings.abc;
      break;
    case 'status':
      orderByColumn = biddings.status;
      break;
    default:
      orderByColumn = biddings.createdAt;
  }

  const orderFn = sortOrder === 'desc' ? desc : asc;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(biddings)
    .where(whereClause);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(biddings)
    .where(whereClause)
    .orderBy(orderFn(orderByColumn))
    .limit(limit)
    .offset(offset);

  return { biddings: result, total, page, totalPages };
}

export async function getBiddingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(biddings).where(eq(biddings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function generateBiddingNumber() {
  const db = await getDb();
  const year = new Date().getFullYear();
  if (!db) return `BID-${year}-001`;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(biddings);

  const count = Number(result?.count ?? 0) + 1;
  return `BID-${year}-${String(count).padStart(3, '0')}`;
}

export async function createBidding(data: {
  powId?: number;
  projectTitle: string;
  abc: string;
  procurementMode?: string;
  preProcurementDate?: Date | null;
  advertisementDate?: Date | null;
  preBidDate?: Date | null;
  bidSubmissionDeadline?: Date | null;
  bidOpeningDate?: Date | null;
  remarks?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const biddingNumber = await generateBiddingNumber();

  const result = await db.insert(biddings).values({
    biddingNumber,
    powId: data.powId || null,
    projectTitle: data.projectTitle,
    abc: data.abc,
    procurementMode: data.procurementMode || "Public Bidding",
    status: "Pre-Procurement",
    preProcurementDate: data.preProcurementDate || null,
    advertisementDate: data.advertisementDate || null,
    preBidDate: data.preBidDate || null,
    bidSubmissionDeadline: data.bidSubmissionDeadline || null,
    bidOpeningDate: data.bidOpeningDate || null,
    remarks: data.remarks || null,
    createdById: data.createdById || null,
  });

  // Update POW status and link bidding
  if (data.powId) {
    await updatePOW(data.powId, {
      status: "For Bidding",
      biddingId: result[0].insertId,
    });
  }

  return { id: result[0].insertId, biddingNumber };
}

export async function updateBidding(id: number, data: Partial<{
  projectTitle: string;
  abc: string;
  procurementMode: string;
  status: string;
  preProcurementDate: Date | null;
  advertisementDate: Date | null;
  preBidDate: Date | null;
  bidSubmissionDeadline: Date | null;
  bidOpeningDate: Date | null;
  bidEvaluationDate: Date | null;
  postQualificationDate: Date | null;
  bacResolutionDate: Date | null;
  noaDate: Date | null;
  contractSigningDate: Date | null;
  ntpDate: Date | null;
  winningBidder: string;
  winningBidAmount: string;
  contractCost: string;
  numberOfBidders: number;
  failedBiddingCount: number;
  failedReason: string;
  projectId: number;
  remarks: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(biddings).set(data).where(eq(biddings.id, id));

  // If bidding is awarded, update POW status
  if (data.status === "Awarded") {
    const bidding = await getBiddingById(id);
    if (bidding?.powId) {
      await updatePOW(bidding.powId, { status: "Awarded" });
    }
  }

  return { success: true };
}

export async function deleteBidding(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get bidding to update POW
  const bidding = await getBiddingById(id);
  if (bidding?.powId) {
    await updatePOW(bidding.powId, {
      status: "Approved",
      biddingId: undefined,
    });
  }

  await db.delete(biddings).where(eq(biddings.id, id));
  return { success: true };
}

export async function getBiddingStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    totalABC: sql<number>`COALESCE(SUM(abc), 0)`,
    totalAwarded: sql<number>`COALESCE(SUM(contractCost), 0)`,
    preProcurement: sql<number>`SUM(CASE WHEN status = 'Pre-Procurement' THEN 1 ELSE 0 END)`,
    advertisement: sql<number>`SUM(CASE WHEN status = 'Advertisement' THEN 1 ELSE 0 END)`,
    bidEvaluation: sql<number>`SUM(CASE WHEN status = 'Bid Evaluation' THEN 1 ELSE 0 END)`,
    postQualification: sql<number>`SUM(CASE WHEN status = 'Post-Qualification' THEN 1 ELSE 0 END)`,
    awarded: sql<number>`SUM(CASE WHEN status = 'Awarded' THEN 1 ELSE 0 END)`,
    failed: sql<number>`SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END)`,
  }).from(biddings);

  return {
    total: Number(stats.total),
    totalABC: Number(stats.totalABC),
    totalAwarded: Number(stats.totalAwarded),
    preProcurement: Number(stats.preProcurement),
    advertisement: Number(stats.advertisement),
    bidEvaluation: Number(stats.bidEvaluation),
    postQualification: Number(stats.postQualification),
    awarded: Number(stats.awarded),
    failed: Number(stats.failed),
  };
}


// ==================== CONTRACTOR QUERIES & CRUD ====================

import { contractors, contractHistory, performanceRatings, Contractor, ContractHistory, PerformanceRating } from "../drizzle/schema";

export type ContractorFilters = {
  search?: string;
  status?: string;
  pcabCategory?: string;
  sortBy?: 'name' | 'rating' | 'contracts' | 'value';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export async function getContractors(filters: ContractorFilters = {}) {
  const db = await getDb();
  if (!db) return { contractors: [], total: 0, page: 1, totalPages: 0 };

  const {
    search,
    status,
    pcabCategory,
    sortBy = 'name',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = filters;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(contractors.name, `%${search}%`),
        like(contractors.tradeName, `%${search}%`),
        like(contractors.tin, `%${search}%`),
        like(contractors.philgepsNumber, `%${search}%`),
        like(contractors.pcabLicense, `%${search}%`)
      )
    );
  }
  if (status) conditions.push(eq(contractors.status, status));
  if (pcabCategory) conditions.push(eq(contractors.pcabCategory, pcabCategory));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contractors)
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Determine sort column
  let orderByColumn;
  switch (sortBy) {
    case 'rating':
      orderByColumn = contractors.overallRating;
      break;
    case 'contracts':
      orderByColumn = contractors.totalContracts;
      break;
    case 'value':
      orderByColumn = contractors.totalContractValue;
      break;
    default:
      orderByColumn = contractors.name;
  }

  const orderFn = sortOrder === 'desc' ? desc : asc;

  const result = await db
    .select()
    .from(contractors)
    .where(whereClause)
    .orderBy(orderFn(orderByColumn))
    .limit(limit)
    .offset(offset);

  return { contractors: result, total, page, totalPages };
}

export async function getContractorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getContractorByTin(tin: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contractors).where(eq(contractors.tin, tin)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getContractorProjects(contractorName: string, page: number = 1, limit: number = 20) {
  const db = await getDb();
  if (!db) return { projects: [], total: 0, page: 1, totalPages: 0, totalCost: 0 };

  // Get total count
  const [countResult] = await db
    .select({ 
      count: sql<number>`count(*)`,
      totalCost: sql<number>`COALESCE(SUM(CAST(REPLACE(REPLACE(projectCost, ',', ''), ' ', '') AS DECIMAL(20,2))), 0)`
    })
    .from(projects)
    .where(eq(projects.contractor, contractorName));

  const total = Number(countResult?.count ?? 0);
  const totalCost = Number(countResult?.totalCost ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select({
      id: projects.id,
      projectId: projects.projectId,
      projectName: projects.projectName,
      location: projects.location,
      projectCost: projects.projectCost,
      status: projects.status,
      fiscalYear: projects.fiscalYear,
      progressPercent: projects.progressPercent,
    })
    .from(projects)
    .where(eq(projects.contractor, contractorName))
    .orderBy(desc(projects.fiscalYear), desc(projects.id))
    .limit(limit)
    .offset(offset);

  return { projects: result, total, page, totalPages, totalCost };
}

export async function createContractor(data: {
  name: string;
  tradeName?: string;
  tin?: string;
  philgepsNumber?: string;
  pcabLicense?: string;
  pcabCategory?: string;
  pcabClassification?: string;
  licenseExpiryDate?: Date | null;
  address?: string;
  city?: string;
  province?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  remarks?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contractors).values({
    name: data.name,
    tradeName: data.tradeName || null,
    tin: data.tin || null,
    philgepsNumber: data.philgepsNumber || null,
    pcabLicense: data.pcabLicense || null,
    pcabCategory: data.pcabCategory || null,
    pcabClassification: data.pcabClassification || null,
    licenseExpiryDate: data.licenseExpiryDate || null,
    address: data.address || null,
    city: data.city || null,
    province: data.province || null,
    contactPerson: data.contactPerson || null,
    email: data.email || null,
    phone: data.phone || null,
    mobile: data.mobile || null,
    status: "Active",
    remarks: data.remarks || null,
    createdById: data.createdById || null,
  });

  return { id: result[0].insertId };
}

export async function updateContractor(id: number, data: Partial<{
  name: string;
  tradeName: string;
  tin: string;
  philgepsNumber: string;
  pcabLicense: string;
  pcabCategory: string;
  pcabClassification: string;
  licenseExpiryDate: Date | null;
  address: string;
  city: string;
  province: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  status: string;
  blacklistReason: string;
  blacklistDate: Date | null;
  remarks: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contractors).set(data).where(eq(contractors.id, id));
  return { success: true };
}

export async function deleteContractor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(contractors).where(eq(contractors.id, id));
  return { success: true };
}

export async function getContractorStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END)`,
    blacklisted: sql<number>`SUM(CASE WHEN status = 'Blacklisted' THEN 1 ELSE 0 END)`,
    suspended: sql<number>`SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END)`,
    inactive: sql<number>`SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END)`,
    totalContractValue: sql<number>`COALESCE(SUM(totalContractValue), 0)`,
    avgRating: sql<number>`COALESCE(AVG(overallRating), 0)`,
  }).from(contractors);

  return {
    total: Number(stats.total),
    active: Number(stats.active),
    blacklisted: Number(stats.blacklisted),
    suspended: Number(stats.suspended),
    inactive: Number(stats.inactive),
    totalContractValue: Number(stats.totalContractValue),
    avgRating: Number(stats.avgRating),
  };
}

// ==================== CONTRACT HISTORY QUERIES & CRUD ====================

export type ContractHistoryFilters = {
  contractorId?: number;
  status?: string;
  page?: number;
  limit?: number;
};

export async function getContractHistories(filters: ContractHistoryFilters = {}) {
  const db = await getDb();
  if (!db) return { contracts: [], total: 0, page: 1, totalPages: 0 };

  const { contractorId, status, page = 1, limit = 20 } = filters;

  const conditions = [];
  if (contractorId) conditions.push(eq(contractHistory.contractorId, contractorId));
  if (status) conditions.push(eq(contractHistory.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contractHistory)
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(contractHistory)
    .where(whereClause)
    .orderBy(desc(contractHistory.startDate))
    .limit(limit)
    .offset(offset);

  return { contracts: result, total, page, totalPages };
}

export async function getContractHistoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contractHistory).where(eq(contractHistory.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createContractHistory(data: {
  contractorId: number;
  projectId?: number;
  biddingId?: number;
  contractNumber?: string;
  projectTitle: string;
  clientName?: string;
  contractAmount?: string;
  startDate?: Date | null;
  originalCompletionDate?: Date | null;
  status?: string;
  remarks?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contractHistory).values({
    contractorId: data.contractorId,
    projectId: data.projectId || null,
    biddingId: data.biddingId || null,
    contractNumber: data.contractNumber || null,
    projectTitle: data.projectTitle,
    clientName: data.clientName || "Province of Palawan - PEO",
    contractAmount: data.contractAmount || null,
    startDate: data.startDate || null,
    originalCompletionDate: data.originalCompletionDate || null,
    status: data.status || "Ongoing",
    remarks: data.remarks || null,
    createdById: data.createdById || null,
  });

  // Update contractor stats
  await updateContractorStats(data.contractorId);

  return { id: result[0].insertId };
}

export async function updateContractHistory(id: number, data: Partial<{
  contractNumber: string;
  projectTitle: string;
  clientName: string;
  contractAmount: string;
  startDate: Date | null;
  originalCompletionDate: Date | null;
  actualCompletionDate: Date | null;
  status: string;
  timeExtensions: number;
  extensionDays: number;
  variationOrders: number;
  variationAmount: string;
  finalAmount: string;
  performanceRating: string;
  liquidatedDamages: string;
  remarks: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contractHistory).set(data).where(eq(contractHistory.id, id));

  // Get contract to update contractor stats
  const contract = await getContractHistoryById(id);
  if (contract) {
    await updateContractorStats(contract.contractorId);
  }

  return { success: true };
}

export async function deleteContractHistory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const contract = await getContractHistoryById(id);
  await db.delete(contractHistory).where(eq(contractHistory.id, id));

  if (contract) {
    await updateContractorStats(contract.contractorId);
  }

  return { success: true };
}

// Helper to update contractor aggregate stats
async function updateContractorStats(contractorId: number) {
  const db = await getDb();
  if (!db) return;

  const [stats] = await db.select({
    totalContracts: sql<number>`count(*)`,
    totalContractValue: sql<number>`COALESCE(SUM(contractAmount), 0)`,
    completedContracts: sql<number>`SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END)`,
    ongoingContracts: sql<number>`SUM(CASE WHEN status = 'Ongoing' THEN 1 ELSE 0 END)`,
    avgRating: sql<number>`COALESCE(AVG(performanceRating), 0)`,
  }).from(contractHistory).where(eq(contractHistory.contractorId, contractorId));

  await db.update(contractors).set({
    totalContracts: Number(stats.totalContracts),
    totalContractValue: String(stats.totalContractValue),
    completedContracts: Number(stats.completedContracts),
    ongoingContracts: Number(stats.ongoingContracts),
    overallRating: String(stats.avgRating),
  }).where(eq(contractors.id, contractorId));
}

// ==================== PERFORMANCE RATINGS QUERIES & CRUD ====================

export type PerformanceRatingFilters = {
  contractorId?: number;
  contractHistoryId?: number;
  page?: number;
  limit?: number;
};

export async function getPerformanceRatings(filters: PerformanceRatingFilters = {}) {
  const db = await getDb();
  if (!db) return { ratings: [], total: 0, page: 1, totalPages: 0 };

  const { contractorId, contractHistoryId, page = 1, limit = 20 } = filters;

  const conditions = [];
  if (contractorId) conditions.push(eq(performanceRatings.contractorId, contractorId));
  if (contractHistoryId) conditions.push(eq(performanceRatings.contractHistoryId, contractHistoryId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(performanceRatings)
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(performanceRatings)
    .where(whereClause)
    .orderBy(desc(performanceRatings.evaluationDate))
    .limit(limit)
    .offset(offset);

  return { ratings: result, total, page, totalPages };
}

export async function getPerformanceRatingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(performanceRatings).where(eq(performanceRatings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPerformanceRating(data: {
  contractorId: number;
  contractHistoryId?: number;
  projectId?: number;
  evaluationPeriod?: string;
  qualityRating?: string;
  timelinessRating?: string;
  safetyRating?: string;
  resourceRating?: string;
  communicationRating?: string;
  evaluatorName?: string;
  evaluatorPosition?: string;
  evaluationDate?: Date | null;
  strengths?: string;
  areasForImprovement?: string;
  comments?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate overall rating
  const ratings = [
    parseFloat(data.qualityRating || "0"),
    parseFloat(data.timelinessRating || "0"),
    parseFloat(data.safetyRating || "0"),
    parseFloat(data.resourceRating || "0"),
    parseFloat(data.communicationRating || "0"),
  ].filter(r => r > 0);
  
  const overallRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
    : "0";

  const result = await db.insert(performanceRatings).values({
    contractorId: data.contractorId,
    contractHistoryId: data.contractHistoryId || null,
    projectId: data.projectId || null,
    evaluationPeriod: data.evaluationPeriod || null,
    qualityRating: data.qualityRating || null,
    timelinessRating: data.timelinessRating || null,
    safetyRating: data.safetyRating || null,
    resourceRating: data.resourceRating || null,
    communicationRating: data.communicationRating || null,
    overallRating: overallRating,
    evaluatorName: data.evaluatorName || null,
    evaluatorPosition: data.evaluatorPosition || null,
    evaluationDate: data.evaluationDate || null,
    strengths: data.strengths || null,
    areasForImprovement: data.areasForImprovement || null,
    comments: data.comments || null,
    createdById: data.createdById || null,
  });

  // Update contractor overall rating
  await updateContractorOverallRating(data.contractorId);

  // Update contract history rating if linked
  if (data.contractHistoryId) {
    await db.update(contractHistory).set({
      performanceRating: overallRating,
    }).where(eq(contractHistory.id, data.contractHistoryId));
  }

  return { id: result[0].insertId };
}

export async function updatePerformanceRating(id: number, data: Partial<{
  evaluationPeriod: string;
  qualityRating: string;
  timelinessRating: string;
  safetyRating: string;
  resourceRating: string;
  communicationRating: string;
  evaluatorName: string;
  evaluatorPosition: string;
  evaluationDate: Date | null;
  strengths: string;
  areasForImprovement: string;
  comments: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Recalculate overall rating if any rating changed
  const rating = await getPerformanceRatingById(id);
  if (rating) {
    const ratings = [
      parseFloat(data.qualityRating || String(rating.qualityRating) || "0"),
      parseFloat(data.timelinessRating || String(rating.timelinessRating) || "0"),
      parseFloat(data.safetyRating || String(rating.safetyRating) || "0"),
      parseFloat(data.resourceRating || String(rating.resourceRating) || "0"),
      parseFloat(data.communicationRating || String(rating.communicationRating) || "0"),
    ].filter(r => r > 0);
    
    const overallRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : "0";

    await db.update(performanceRatings).set({
      ...data,
      overallRating: overallRating,
    }).where(eq(performanceRatings.id, id));

    await updateContractorOverallRating(rating.contractorId);
  }

  return { success: true };
}

export async function deletePerformanceRating(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rating = await getPerformanceRatingById(id);
  await db.delete(performanceRatings).where(eq(performanceRatings.id, id));

  if (rating) {
    await updateContractorOverallRating(rating.contractorId);
  }

  return { success: true };
}

// Helper to update contractor overall rating from all performance ratings
async function updateContractorOverallRating(contractorId: number) {
  const db = await getDb();
  if (!db) return;

  const [stats] = await db.select({
    avgRating: sql<number>`COALESCE(AVG(overallRating), 0)`,
  }).from(performanceRatings).where(eq(performanceRatings.contractorId, contractorId));

  await db.update(contractors).set({
    overallRating: String(stats.avgRating),
  }).where(eq(contractors.id, contractorId));
}


// ==================== USER MANAGEMENT ====================

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  approvalStatus?: string;
  role?: string;
  division?: string;
}

export async function getUsers(filters: UserFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { page = 1, limit = 20, search, approvalStatus, role, division } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }

  if (approvalStatus) {
    conditions.push(eq(users.approvalStatus, approvalStatus as "pending" | "approved" | "rejected"));
  }

  if (role) {
    conditions.push(eq(users.role, role as "user" | "admin"));
  }

  if (division) {
    conditions.push(eq(users.division, division as "Admin" | "Planning" | "Construction" | "Quality" | "Maintenance"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(whereClause),
  ]);

  return {
    data,
    total: countResult[0]?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
  };
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function approveUser(id: number, approvedById: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    approvalStatus: "approved",
    approvedById,
    approvalDate: new Date(),
    rejectionReason: null,
  }).where(eq(users.id, id));

  return { success: true };
}

export async function rejectUser(id: number, approvedById: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    approvalStatus: "rejected",
    approvedById,
    approvalDate: new Date(),
    rejectionReason: reason || null,
  }).where(eq(users.id, id));

  return { success: true };
}

export async function updateUserRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, id));
  return { success: true };
}

export async function updateUserDivision(id: number, division: "Admin" | "Planning" | "Construction" | "Quality" | "Maintenance" | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ division }).where(eq(users.id, id));
  return { success: true };
}

export async function updateUserDetails(id: number, data: {
  division?: "Admin" | "Planning" | "Construction" | "Quality" | "Maintenance" | null;
  position?: string | null;
  isDivisionHead?: boolean;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (data.division !== undefined) updateData.division = data.division;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.isDivisionHead !== undefined) updateData.isDivisionHead = data.isDivisionHead;
  if (data.role !== undefined) updateData.role = data.role;

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, id));
  }

  return { success: true };
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, id));
  return { success: true };
}

export async function getUserStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN approvalStatus = 'pending' THEN 1 ELSE 0 END)`,
    approved: sql<number>`SUM(CASE WHEN approvalStatus = 'approved' THEN 1 ELSE 0 END)`,
    rejected: sql<number>`SUM(CASE WHEN approvalStatus = 'rejected' THEN 1 ELSE 0 END)`,
    admins: sql<number>`SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END)`,
  }).from(users);

  return {
    total: stats.total || 0,
    pending: stats.pending || 0,
    approved: stats.approved || 0,
    rejected: stats.rejected || 0,
    admins: stats.admins || 0,
  };
}


// ============================================
// MAINTENANCE DIVISION - PROVINCIAL ROADS
// ============================================

export async function getProvincialRoads(filters: {
  search?: string;
  municipality?: string;
  roadCondition?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { search, municipality, roadCondition, sortBy = "roadName", sortOrder = "asc", page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "1=1";
  if (search) {
    whereClause += ` AND (roadName LIKE '%${search}%' OR roadId LIKE '%${search}%')`;
  }
  if (municipality) {
    whereClause += ` AND municipality = '${municipality}'`;
  }
  if (roadCondition) {
    whereClause += ` AND roadCondition = '${roadCondition}'`;
  }

  // Map sortBy to actual column names
  let orderColumn = "roadName";
  if (sortBy === "roadId") orderColumn = "roadId";
  else if (sortBy === "municipality") orderColumn = "municipality";
  else if (sortBy === "length") orderColumn = "lengthKm";
  else if (sortBy === "condition") orderColumn = "roadCondition";
  else if (sortBy === "roadName") orderColumn = "roadName";
  
  const orderDir = sortOrder === "desc" ? "DESC" : "ASC";

  const [countResult] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM provincial_roads WHERE ${whereClause}`));
  const total = (countResult as any)[0]?.total || 0;

  // Apply user-selected sorting
  const roads = await db.execute(sql.raw(`
    SELECT * FROM provincial_roads 
    WHERE ${whereClause}
    ORDER BY ${orderColumn} ${orderDir}
    LIMIT ${limit} OFFSET ${offset}
  `));

  return {
    roads: (roads as any)[0] || [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProvincialRoadById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.execute(sql.raw(`SELECT * FROM provincial_roads WHERE id = ${id}`));
  return (result as any)[0] || null;
}

export async function getRoadMunicipalities() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql.raw(`
    SELECT DISTINCT municipality, COUNT(*) as count, SUM(lengthKm) as totalKm
    FROM provincial_roads 
    WHERE municipality IS NOT NULL AND municipality != ''
    GROUP BY municipality
    ORDER BY municipality
  `));

  return (result as any)[0] || [];
}

export async function getRoadStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db.execute(sql.raw(`
    SELECT 
      COUNT(*) as totalRoads,
      SUM(lengthKm) as totalLengthKm,
      SUM(concreteLengthKm) as concreteKm,
      SUM(asphaltLengthKm) as asphaltKm,
      SUM(earthLengthKm) as earthKm,
      SUM(gravelLengthKm) as gravelKm,
      SUM(CASE WHEN roadCondition = 'Good' THEN 1 ELSE 0 END) as goodCondition,
      SUM(CASE WHEN roadCondition = 'Fair' THEN 1 ELSE 0 END) as fairCondition,
      SUM(CASE WHEN roadCondition = 'Poor' THEN 1 ELSE 0 END) as poorCondition,
      SUM(CASE WHEN roadCondition = 'Bad' THEN 1 ELSE 0 END) as badCondition,
      COUNT(DISTINCT municipality) as municipalities
    FROM provincial_roads
  `));

  return (stats as any)[0] || {};
}

// ============================================
// MAINTENANCE EQUIPMENT
// ============================================

export async function getMaintenanceEquipment(filters: {
  search?: string;
  equipmentType?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { search, equipmentType, status, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "1=1";
  if (search) {
    whereClause += ` AND (name LIKE '%${search}%' OR equipmentCode LIKE '%${search}%')`;
  }
  if (equipmentType) {
    whereClause += ` AND equipmentType = '${equipmentType}'`;
  }
  if (status) {
    whereClause += ` AND status = '${status}'`;
  }

  const [countResult] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM maintenance_equipment WHERE ${whereClause}`));
  const total = (countResult as any)[0]?.total || 0;

  const equipment = await db.execute(sql.raw(`
    SELECT * FROM maintenance_equipment 
    WHERE ${whereClause}
    ORDER BY name ASC
    LIMIT ${limit} OFFSET ${offset}
  `));

  return {
    equipment: (equipment as any)[0] || [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEquipmentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.execute(sql.raw(`SELECT * FROM maintenance_equipment WHERE id = ${id}`));
  return (result as any)[0] || null;
}

export async function createEquipment(data: {
  name: string;
  equipmentType?: string;
  equipmentCode?: string;
  model?: string;
  plateNumber?: string;
  status?: string;
  currentLocation?: string;
  operatorName?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql.raw(`
    INSERT INTO maintenance_equipment (name, equipmentType, equipmentCode, model, plateNumber, status, currentLocation, operatorName, notes, createdAt, updatedAt)
    VALUES (
      '${data.name.replace(/'/g, "''")}',
      ${data.equipmentType ? `'${data.equipmentType}'` : "NULL"},
      ${data.equipmentCode ? `'${data.equipmentCode.replace(/'/g, "''")}'` : "NULL"},
      ${data.model ? `'${data.model.replace(/'/g, "''")}'` : "NULL"},
      ${data.plateNumber ? `'${data.plateNumber.replace(/'/g, "''")}'` : "NULL"},
      ${data.status ? `'${data.status}'` : "'Available'"},
      ${data.currentLocation ? `'${data.currentLocation.replace(/'/g, "''")}'` : "NULL"},
      ${data.operatorName ? `'${data.operatorName.replace(/'/g, "''")}'` : "NULL"},
      ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : "NULL"},
      NOW(),
      NOW()
    )
  `));

  return { id: (result as any)[0]?.insertId };
}

export async function updateEquipment(id: number, data: Partial<{
  name: string;
  equipmentType: string;
  equipmentCode: string;
  model: string;
  plateNumber: string;
  status: string;
  currentLocation: string;
  operatorName: string;
  notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: string[] = [];
  if (data.name !== undefined) updates.push(`name = '${data.name.replace(/'/g, "''")}'`);
  if (data.equipmentType !== undefined) updates.push(`equipmentType = '${data.equipmentType}'`);
  if (data.equipmentCode !== undefined) updates.push(`equipmentCode = '${data.equipmentCode.replace(/'/g, "''")}'`);
  if (data.model !== undefined) updates.push(`model = '${data.model.replace(/'/g, "''")}'`);
  if (data.plateNumber !== undefined) updates.push(`plateNumber = '${data.plateNumber.replace(/'/g, "''")}'`);
  if (data.status !== undefined) updates.push(`status = '${data.status}'`);
  if (data.currentLocation !== undefined) updates.push(`currentLocation = '${data.currentLocation.replace(/'/g, "''")}'`);
  if (data.operatorName !== undefined) updates.push(`operatorName = '${data.operatorName.replace(/'/g, "''")}'`);
  if (data.notes !== undefined) updates.push(`notes = '${data.notes.replace(/'/g, "''")}'`);
  updates.push("updatedAt = NOW()");

  await db.execute(sql.raw(`UPDATE maintenance_equipment SET ${updates.join(", ")} WHERE id = ${id}`));
  return { success: true };
}

export async function deleteEquipment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(sql.raw(`DELETE FROM maintenance_equipment WHERE id = ${id}`));
  return { success: true };
}

export async function getEquipmentStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db.execute(sql.raw(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'In Use' THEN 1 ELSE 0 END) as inUse,
      SUM(CASE WHEN status = 'Under Maintenance' THEN 1 ELSE 0 END) as underMaintenance,
      SUM(CASE WHEN status = 'Out of Service' THEN 1 ELSE 0 END) as outOfService
    FROM maintenance_equipment
  `));

  return (stats as any)[0] || {};
}

// ============================================
// MAINTENANCE SCHEDULES
// ============================================

export async function getMaintenanceSchedules(filters: {
  search?: string;
  roadId?: number;
  maintenanceType?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { search, roadId, maintenanceType, status, priority, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "1=1";
  if (search) {
    whereClause += ` AND ms.title LIKE '%${search}%'`;
  }
  if (roadId) {
    whereClause += ` AND ms.roadId = ${roadId}`;
  }
  if (maintenanceType) {
    whereClause += ` AND ms.maintenanceType = '${maintenanceType}'`;
  }
  if (status) {
    whereClause += ` AND ms.scheduleStatus = '${status}'`;
  }
  if (priority) {
    whereClause += ` AND ms.priority = '${priority}'`;
  }

  const [countResult] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM maintenance_schedules ms WHERE ${whereClause}`));
  const total = (countResult as any)[0]?.total || 0;

  const schedules = await db.execute(sql.raw(`
    SELECT ms.*, pr.roadName, pr.municipality
    FROM maintenance_schedules ms
    LEFT JOIN provincial_roads pr ON ms.roadId = pr.id
    WHERE ${whereClause}
    ORDER BY ms.scheduledStartDate DESC
    LIMIT ${limit} OFFSET ${offset}
  `));

  return {
    schedules: (schedules as any)[0] || [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getScheduleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.execute(sql.raw(`
    SELECT ms.*, pr.roadName, pr.municipality
    FROM maintenance_schedules ms
    LEFT JOIN provincial_roads pr ON ms.roadId = pr.id
    WHERE ms.id = ${id}
  `));
  return (result as any)[0] || null;
}

export async function createSchedule(data: {
  roadId?: number;
  title: string;
  maintenanceType?: string;
  priority?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  estimatedCost?: number;
  assignedTeam?: string;
  kmStart?: number;
  kmEnd?: number;
  notes?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql.raw(`
    INSERT INTO maintenance_schedules (roadId, title, maintenanceType, priority, scheduledStartDate, scheduledEndDate, estimatedCost, assignedTeam, kmStart, kmEnd, notes, createdById, scheduleStatus, createdAt, updatedAt)
    VALUES (
      ${data.roadId || "NULL"},
      '${data.title.replace(/'/g, "''")}',
      ${data.maintenanceType ? `'${data.maintenanceType}'` : "NULL"},
      ${data.priority ? `'${data.priority}'` : "'Medium'"},
      ${data.scheduledStartDate ? `'${data.scheduledStartDate}'` : "NULL"},
      ${data.scheduledEndDate ? `'${data.scheduledEndDate}'` : "NULL"},
      ${data.estimatedCost || "NULL"},
      ${data.assignedTeam ? `'${data.assignedTeam.replace(/'/g, "''")}'` : "NULL"},
      ${data.kmStart || "NULL"},
      ${data.kmEnd || "NULL"},
      ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : "NULL"},
      ${data.createdById || "NULL"},
      'Scheduled',
      NOW(),
      NOW()
    )
  `));

  return { id: (result as any)[0]?.insertId };
}

export async function updateSchedule(id: number, data: Partial<{
  roadId: number;
  title: string;
  maintenanceType: string;
  priority: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  status: string;
  estimatedCost: number;
  actualCost: number;
  assignedTeam: string;
  kmStart: number;
  kmEnd: number;
  notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: string[] = [];
  if (data.roadId !== undefined) updates.push(`roadId = ${data.roadId}`);
  if (data.title !== undefined) updates.push(`title = '${data.title.replace(/'/g, "''")}'`);
  if (data.maintenanceType !== undefined) updates.push(`maintenanceType = '${data.maintenanceType}'`);
  if (data.priority !== undefined) updates.push(`priority = '${data.priority}'`);
  if (data.scheduledStartDate !== undefined) updates.push(`scheduledStartDate = '${data.scheduledStartDate}'`);
  if (data.scheduledEndDate !== undefined) updates.push(`scheduledEndDate = '${data.scheduledEndDate}'`);
  if (data.actualStartDate !== undefined) updates.push(`actualStartDate = '${data.actualStartDate}'`);
  if (data.actualEndDate !== undefined) updates.push(`actualEndDate = '${data.actualEndDate}'`);
  if (data.status !== undefined) updates.push(`scheduleStatus = '${data.status}'`);
  if (data.estimatedCost !== undefined) updates.push(`estimatedCost = ${data.estimatedCost}`);
  if (data.actualCost !== undefined) updates.push(`actualCost = ${data.actualCost}`);
  if (data.assignedTeam !== undefined) updates.push(`assignedTeam = '${data.assignedTeam.replace(/'/g, "''")}'`);
  if (data.kmStart !== undefined) updates.push(`kmStart = ${data.kmStart}`);
  if (data.kmEnd !== undefined) updates.push(`kmEnd = ${data.kmEnd}`);
  if (data.notes !== undefined) updates.push(`notes = '${data.notes.replace(/'/g, "''")}'`);
  updates.push("updatedAt = NOW()");

  await db.execute(sql.raw(`UPDATE maintenance_schedules SET ${updates.join(", ")} WHERE id = ${id}`));
  return { success: true };
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(sql.raw(`DELETE FROM maintenance_schedules WHERE id = ${id}`));
  return { success: true };
}

export async function getScheduleStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db.execute(sql.raw(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN scheduleStatus = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN scheduleStatus = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN scheduleStatus = 'Completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN scheduleStatus = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN priority = 'Urgent' THEN 1 ELSE 0 END) as urgent,
      SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as highPriority
    FROM maintenance_schedules
  `));

  return (stats as any)[0] || {};
}

// ============================================
// EQUIPMENT ASSIGNMENTS
// ============================================

export async function getEquipmentAssignments(filters: {
  scheduleId?: number;
  equipmentId?: number;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { scheduleId, equipmentId, status, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = "1=1";
  if (scheduleId) {
    whereClause += ` AND ea.scheduleId = ${scheduleId}`;
  }
  if (equipmentId) {
    whereClause += ` AND ea.equipmentId = ${equipmentId}`;
  }
  if (status) {
    whereClause += ` AND ea.assignmentStatus = '${status}'`;
  }

  const [countResult] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM equipment_assignments ea WHERE ${whereClause}`));
  const total = (countResult as any)[0]?.total || 0;

  const assignments = await db.execute(sql.raw(`
    SELECT ea.*, me.name as equipmentName, me.equipmentType, ms.title as scheduleTitle
    FROM equipment_assignments ea
    LEFT JOIN maintenance_equipment me ON ea.equipmentId = me.id
    LEFT JOIN maintenance_schedules ms ON ea.scheduleId = ms.id
    WHERE ${whereClause}
    ORDER BY ea.startDate DESC
    LIMIT ${limit} OFFSET ${offset}
  `));

  return {
    assignments: (assignments as any)[0] || [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createEquipmentAssignment(data: {
  scheduleId: number;
  equipmentId: number;
  startDate?: string;
  endDate?: string;
  operatorName?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update equipment status to "In Use"
  await db.execute(sql.raw(`UPDATE maintenance_equipment SET status = 'In Use' WHERE id = ${data.equipmentId}`));

  const result = await db.execute(sql.raw(`
    INSERT INTO equipment_assignments (scheduleId, equipmentId, startDate, endDate, operatorName, notes, assignmentStatus, createdAt, updatedAt)
    VALUES (
      ${data.scheduleId},
      ${data.equipmentId},
      ${data.startDate ? `'${data.startDate}'` : "NULL"},
      ${data.endDate ? `'${data.endDate}'` : "NULL"},
      ${data.operatorName ? `'${data.operatorName.replace(/'/g, "''")}'` : "NULL"},
      ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : "NULL"},
      'Assigned',
      NOW(),
      NOW()
    )
  `));

  return { id: (result as any)[0]?.insertId };
}

export async function updateEquipmentAssignment(id: number, data: Partial<{
  startDate: string;
  endDate: string;
  operatorName: string;
  hoursUsed: number;
  fuelConsumed: number;
  status: string;
  notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: string[] = [];
  if (data.startDate !== undefined) updates.push(`startDate = '${data.startDate}'`);
  if (data.endDate !== undefined) updates.push(`endDate = '${data.endDate}'`);
  if (data.operatorName !== undefined) updates.push(`operatorName = '${data.operatorName.replace(/'/g, "''")}'`);
  if (data.hoursUsed !== undefined) updates.push(`hoursUsed = ${data.hoursUsed}`);
  if (data.fuelConsumed !== undefined) updates.push(`fuelConsumed = ${data.fuelConsumed}`);
  if (data.status !== undefined) updates.push(`assignmentStatus = '${data.status}'`);
  if (data.notes !== undefined) updates.push(`notes = '${data.notes.replace(/'/g, "''")}'`);
  updates.push("updatedAt = NOW()");

  await db.execute(sql.raw(`UPDATE equipment_assignments SET ${updates.join(", ")} WHERE id = ${id}`));

  // If status is "Returned" or "Completed", update equipment status back to "Available"
  if (data.status === "Returned" || data.status === "Completed") {
    const [assignment] = await db.execute(sql.raw(`SELECT equipmentId FROM equipment_assignments WHERE id = ${id}`));
    const equipmentId = (assignment as any)[0]?.equipmentId;
    if (equipmentId) {
      await db.execute(sql.raw(`UPDATE maintenance_equipment SET status = 'Available' WHERE id = ${equipmentId}`));
    }
  }

  return { success: true };
}

export async function deleteEquipmentAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get equipment ID before deleting
  const [assignment] = await db.execute(sql.raw(`SELECT equipmentId FROM equipment_assignments WHERE id = ${id}`));
  const equipmentId = (assignment as any)[0]?.equipmentId;

  await db.execute(sql.raw(`DELETE FROM equipment_assignments WHERE id = ${id}`));

  // Update equipment status back to "Available"
  if (equipmentId) {
    await db.execute(sql.raw(`UPDATE maintenance_equipment SET status = 'Available' WHERE id = ${equipmentId}`));
  }

  return { success: true };
}
