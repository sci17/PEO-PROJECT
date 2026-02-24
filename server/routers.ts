import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getProjects,
  getProjectById,
  getProjectCategories,
  getProjectMunicipalities,
  getProjectStatuses,
  getProjectYears,
  getProjectStats,
  createProject,
  updateProject,
  deleteProject,
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getPersonnel,
  getPersonnelById,
  getPersonnelByDivision,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  getPersonnelStats,
  getAnnualBudgets,
  getAnnualBudgetById,
  getAnnualBudgetByYear,
  createAnnualBudget,
  updateAnnualBudget,
  deleteAnnualBudget,
  getBudgetStats,
  getProgramOfWorks,
  getPOWById,
  createPOW,
  updatePOW,
  deletePOW,
  getPOWStats,
  getBiddings,
  getBiddingById,
  createBidding,
  updateBidding,
  deleteBidding,
  getBiddingStats,
  getContractors,
  getContractorById,
  getContractorProjects,
  createContractor,
  updateContractor,
  deleteContractor,
  getContractorStats,
  getContractHistories,
  getContractHistoryById,
  createContractHistory,
  updateContractHistory,
  deleteContractHistory,
  getPerformanceRatings,
  getPerformanceRatingById,
  createPerformanceRating,
  updatePerformanceRating,
  deletePerformanceRating,
  getUsers,
  getUserById,
  approveUser,
  rejectUser,
  updateUserRole,
  updateUserDivision,
  updateUserDetails,
  deleteUser,
  getUserStats,
  // Maintenance functions
  getProvincialRoads,
  getProvincialRoadById,
  getRoadMunicipalities,
  getRoadStats,
  getMaintenanceEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentStats,
  getMaintenanceSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleStats,
  getEquipmentAssignments,
  createEquipmentAssignment,
  updateEquipmentAssignment,
  deleteEquipmentAssignment,
} from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Project routes
  projects: router({
    // List projects with filters, sorting, and pagination
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          municipality: z.string().optional(),
          status: z.string().optional(),
          fiscalYear: z.number().optional(),
          sortBy: z.enum(['name', 'amount', 'category', 'year', 'municipality']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getProjects(input ?? {});
      }),

    // Get single project by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProjectById(input.id);
      }),

    // Get filter options
    categories: publicProcedure.query(async () => {
      return getProjectCategories();
    }),

    municipalities: publicProcedure.query(async () => {
      return getProjectMunicipalities();
    }),

    statuses: publicProcedure.query(async () => {
      return getProjectStatuses();
    }),

    years: publicProcedure.query(async () => {
      return getProjectYears();
    }),

    // Get project statistics
    stats: publicProcedure.query(async () => {
      return getProjectStats();
    }),

    // Create a new project
    create: protectedProcedure
      .input(
        z.object({
          projectName: z.string().min(1),
          category: z.string().optional(),
          projectId: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          municipality: z.string().optional(),
          fiscalYear: z.number().optional(),
          projectCost: z.string().optional(),
          contractor: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createProject({
          ...input,
          createdById: ctx.user.id,
        });
      }),

    // Update a project
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          projectName: z.string().optional(),
          category: z.string().optional(),
          projectId: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          municipality: z.string().optional(),
          fiscalYear: z.number().optional(),
          projectCost: z.string().optional(),
          contractor: z.string().optional(),
          status: z.string().optional(),
          progressPercent: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateProject(id, data);
      }),

    // Delete a project
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteProject(input.id);
      }),
  }),

  // Document routes
  documents: router({
    // List documents with filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          division: z.string().optional(),
          status: z.string().optional(),
          projectId: z.number().optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getDocuments(input ?? {});
      }),

    // Get single document by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDocumentById(input.id);
      }),

    // Get document statistics
    stats: publicProcedure.query(async () => {
      return getDocumentStats();
    }),

    // Create a new document
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          refNumber: z.string().optional(),
          documentType: z.string().optional(),
          projectId: z.number().optional(),
          division: z.string().optional(),
          status: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          // Routing fields
          dateReceivedByPEO: z.date().optional(),
          dateReleasedToAdmin: z.date().optional(),
          dateReceivedFromAdmin: z.date().optional(),
          dateReleasedToAccounting: z.date().optional(),
          // Billing fields
          billingType: z.string().optional(),
          percentage: z.string().optional(),
          contractorId: z.number().optional(),
          contractAmount: z.string().optional(),
          revisedContractAmount: z.string().optional(),
          periodCovered: z.string().optional(),
          dateStarted: z.date().optional(),
          completionDate: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createDocument({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a document
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          documentType: z.string().optional(),
          division: z.string().optional(),
          status: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          // Routing fields
          dateReceivedByPEO: z.date().optional(),
          dateReleasedToAdmin: z.date().optional(),
          dateReceivedFromAdmin: z.date().optional(),
          dateReleasedToAccounting: z.date().optional(),
          // Billing fields
          billingType: z.string().optional(),
          percentage: z.string().optional(),
          contractorId: z.number().optional(),
          contractAmount: z.string().optional(),
          revisedContractAmount: z.string().optional(),
          periodCovered: z.string().optional(),
          dateStarted: z.date().optional(),
          completionDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, dueDate, ...rest } = input;
        return updateDocument(id, {
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
      }),

    // Delete a document
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteDocument(input.id);
      }),
  }),

  // Task routes
  tasks: router({
    // List tasks with filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          division: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          projectId: z.number().optional(),
          assignedToId: z.number().optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getTasks(input ?? {});
      }),

    // Get single task by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getTaskById(input.id);
      }),

    // Get task statistics
    stats: publicProcedure.query(async () => {
      return getTaskStats();
    }),

    // Create a new task
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          taskCode: z.string().optional(),
          description: z.string().optional(),
          division: z.string().optional(),
          projectId: z.number().optional(),
          documentId: z.number().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          assignedToId: z.number().optional(),
          dueDate: z.string().optional(),
          sla: z.string().optional(),
          frequency: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createTask({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a task
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          division: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          assignedToId: z.number().optional(),
          dueDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, dueDate, ...rest } = input;
        return updateTask(id, {
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
      }),

    // Delete a task
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteTask(input.id);
      }),
  }),

  // Annual Budget routes
  budgets: router({
    // List budgets
    list: publicProcedure
      .input(
        z.object({
          fiscalYear: z.number().optional(),
          status: z.string().optional(),
          sortBy: z.enum(['year', 'amount', 'status']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getAnnualBudgets(input ?? {});
      }),

    // Get single budget by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAnnualBudgetById(input.id);
      }),

    // Get budget by fiscal year
    byYear: publicProcedure
      .input(z.object({ fiscalYear: z.number() }))
      .query(async ({ input }) => {
        return getAnnualBudgetByYear(input.fiscalYear);
      }),

    // Get budget statistics
    stats: publicProcedure.query(async () => {
      return getBudgetStats();
    }),

    // Create a new budget
    create: protectedProcedure
      .input(
        z.object({
          fiscalYear: z.number(),
          totalBudget: z.string(),
          status: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createAnnualBudget({
          ...input,
          createdById: ctx.user.id,
        });
      }),

    // Update a budget
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          totalBudget: z.string().optional(),
          allocatedAmount: z.string().optional(),
          remainingAmount: z.string().optional(),
          status: z.string().optional(),
          approvedDate: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, approvedDate, ...rest } = input;
        return updateAnnualBudget(id, {
          ...rest,
          approvedDate: approvedDate ? new Date(approvedDate) : null,
        });
      }),

    // Delete a budget
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteAnnualBudget(input.id);
      }),
  }),

  // Program of Works (POW) routes
  pow: router({
    // List POWs with filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          fiscalYear: z.number().optional(),
          status: z.string().optional(),
          category: z.string().optional(),
          budgetId: z.number().optional(),
          sortBy: z.enum(['title', 'cost', 'status', 'date']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getProgramOfWorks(input ?? {});
      }),

    // Get single POW by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getPOWById(input.id);
      }),

    // Get POW statistics
    stats: publicProcedure
      .input(z.object({ fiscalYear: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getPOWStats({ fiscalYear: input?.fiscalYear });
      }),

    // Create a new POW
    create: protectedProcedure
      .input(
        z.object({
          projectTitle: z.string().min(1),
          description: z.string().optional(),
          location: z.string().optional(),
          municipality: z.string().optional(),
          category: z.string().optional(),
          budgetId: z.number().optional(),
          fiscalYear: z.number(),
          estimatedCost: z.string(),
          sourceOfFund: z.string().optional(),
          targetBiddingDate: z.string().optional(),
          targetStartDate: z.string().optional(),
          targetCompletionDate: z.string().optional(),
          calendarDays: z.number().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createPOW({
          ...input,
          targetBiddingDate: input.targetBiddingDate ? new Date(input.targetBiddingDate) : null,
          targetStartDate: input.targetStartDate ? new Date(input.targetStartDate) : null,
          targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a POW
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          projectTitle: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          municipality: z.string().optional(),
          category: z.string().optional(),
          estimatedCost: z.string().optional(),
          status: z.string().optional(),
          dedStatus: z.string().optional(),
          dedCompletedDate: z.string().optional(),
          plansSpecsReady: z.boolean().optional(),
          targetBiddingDate: z.string().optional(),
          targetStartDate: z.string().optional(),
          targetCompletionDate: z.string().optional(),
          calendarDays: z.number().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, dedCompletedDate, targetBiddingDate, targetStartDate, targetCompletionDate, ...rest } = input;
        return updatePOW(id, {
          ...rest,
          dedCompletedDate: dedCompletedDate ? new Date(dedCompletedDate) : null,
          targetBiddingDate: targetBiddingDate ? new Date(targetBiddingDate) : null,
          targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
          targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
        });
      }),

    // Delete a POW
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePOW(input.id);
      }),
  }),

  // Bidding routes
  biddings: router({
    // List biddings with filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          status: z.string().optional(),
          procurementMode: z.string().optional(),
          powId: z.number().optional(),
          sortBy: z.enum(['title', 'abc', 'status', 'date']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getBiddings(input ?? {});
      }),

    // Get single bidding by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBiddingById(input.id);
      }),

    // Get bidding statistics
    stats: publicProcedure.query(async () => {
      return getBiddingStats();
    }),

    // Create a new bidding
    create: protectedProcedure
      .input(
        z.object({
          powId: z.number().optional(),
          projectTitle: z.string().min(1),
          abc: z.string(),
          procurementMode: z.string().optional(),
          preProcurementDate: z.string().optional(),
          advertisementDate: z.string().optional(),
          preBidDate: z.string().optional(),
          bidSubmissionDeadline: z.string().optional(),
          bidOpeningDate: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createBidding({
          ...input,
          preProcurementDate: input.preProcurementDate ? new Date(input.preProcurementDate) : null,
          advertisementDate: input.advertisementDate ? new Date(input.advertisementDate) : null,
          preBidDate: input.preBidDate ? new Date(input.preBidDate) : null,
          bidSubmissionDeadline: input.bidSubmissionDeadline ? new Date(input.bidSubmissionDeadline) : null,
          bidOpeningDate: input.bidOpeningDate ? new Date(input.bidOpeningDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a bidding
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          projectTitle: z.string().optional(),
          abc: z.string().optional(),
          procurementMode: z.string().optional(),
          status: z.string().optional(),
          preProcurementDate: z.string().optional(),
          advertisementDate: z.string().optional(),
          preBidDate: z.string().optional(),
          bidSubmissionDeadline: z.string().optional(),
          bidOpeningDate: z.string().optional(),
          bidEvaluationDate: z.string().optional(),
          postQualificationDate: z.string().optional(),
          bacResolutionDate: z.string().optional(),
          noaDate: z.string().optional(),
          contractSigningDate: z.string().optional(),
          ntpDate: z.string().optional(),
          winningBidder: z.string().optional(),
          winningBidAmount: z.string().optional(),
          contractCost: z.string().optional(),
          numberOfBidders: z.number().optional(),
          failedBiddingCount: z.number().optional(),
          failedReason: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, preProcurementDate, advertisementDate, preBidDate, bidSubmissionDeadline, bidOpeningDate, bidEvaluationDate, postQualificationDate, bacResolutionDate, noaDate, contractSigningDate, ntpDate, ...rest } = input;
        return updateBidding(id, {
          ...rest,
          preProcurementDate: preProcurementDate ? new Date(preProcurementDate) : null,
          advertisementDate: advertisementDate ? new Date(advertisementDate) : null,
          preBidDate: preBidDate ? new Date(preBidDate) : null,
          bidSubmissionDeadline: bidSubmissionDeadline ? new Date(bidSubmissionDeadline) : null,
          bidOpeningDate: bidOpeningDate ? new Date(bidOpeningDate) : null,
          bidEvaluationDate: bidEvaluationDate ? new Date(bidEvaluationDate) : null,
          postQualificationDate: postQualificationDate ? new Date(postQualificationDate) : null,
          bacResolutionDate: bacResolutionDate ? new Date(bacResolutionDate) : null,
          noaDate: noaDate ? new Date(noaDate) : null,
          contractSigningDate: contractSigningDate ? new Date(contractSigningDate) : null,
          ntpDate: ntpDate ? new Date(ntpDate) : null,
        });
      }),

    // Delete a bidding
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBidding(input.id);
      }),
  }),

  // Personnel routes
  personnel: router({
    // List personnel with filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          division: z.string().optional(),
          isActive: z.boolean().optional(),
          isDivisionHead: z.boolean().optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getPersonnel(input ?? {});
      }),

    // Get single personnel by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getPersonnelById(input.id);
      }),

    // Get personnel by division (for task assignment dropdown)
    byDivision: publicProcedure
      .input(z.object({ division: z.string() }))
      .query(async ({ input }) => {
        return getPersonnelByDivision(input.division);
      }),

    // Get personnel statistics
    stats: publicProcedure.query(async () => {
      return getPersonnelStats();
    }),

    // Create a new personnel
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          employeeId: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          division: z.string(),
          position: z.string().optional(),
          isDivisionHead: z.boolean().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createPersonnel(input);
      }),

    // Update a personnel
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          employeeId: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          division: z.string().optional(),
          position: z.string().optional(),
          isDivisionHead: z.boolean().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePersonnel(id, data);
      }),

    // Delete a personnel
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePersonnel(input.id);
      }),
  }),

  // Contractor routes
  contractors: router({
    // List contractors with filters
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          status: z.string().optional(),
          pcabCategory: z.string().optional(),
          sortBy: z.enum(['name', 'rating', 'contracts', 'value']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getContractors(input ?? {});
      }),

    // Get single contractor by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContractorById(input.id);
      }),

    // Get contractor statistics
    stats: publicProcedure.query(async () => {
      return getContractorStats();
    }),

    // Get contractor's projects/contracts
    projects: publicProcedure
      .input(
        z.object({
          contractorName: z.string(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return getContractorProjects(input.contractorName, input.page, input.limit);
      }),

    // Create a new contractor
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          tradeName: z.string().optional(),
          tin: z.string().optional(),
          philgepsNumber: z.string().optional(),
          pcabLicense: z.string().optional(),
          pcabCategory: z.string().optional(),
          pcabClassification: z.string().optional(),
          licenseExpiryDate: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          province: z.string().optional(),
          contactPerson: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          mobile: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createContractor({
          ...input,
          licenseExpiryDate: input.licenseExpiryDate ? new Date(input.licenseExpiryDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a contractor
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          tradeName: z.string().optional(),
          tin: z.string().optional(),
          philgepsNumber: z.string().optional(),
          pcabLicense: z.string().optional(),
          pcabCategory: z.string().optional(),
          pcabClassification: z.string().optional(),
          licenseExpiryDate: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          province: z.string().optional(),
          contactPerson: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          mobile: z.string().optional(),
          status: z.string().optional(),
          blacklistReason: z.string().optional(),
          blacklistDate: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, licenseExpiryDate, blacklistDate, ...rest } = input;
        return updateContractor(id, {
          ...rest,
          licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
          blacklistDate: blacklistDate ? new Date(blacklistDate) : null,
        });
      }),

    // Delete a contractor
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteContractor(input.id);
      }),
  }),

  // Contract History routes
  contractHistory: router({
    // List contract histories
    list: publicProcedure
      .input(
        z.object({
          contractorId: z.number().optional(),
          status: z.string().optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getContractHistories(input ?? {});
      }),

    // Get single contract history by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContractHistoryById(input.id);
      }),

    // Create a new contract history
    create: protectedProcedure
      .input(
        z.object({
          contractorId: z.number(),
          projectId: z.number().optional(),
          biddingId: z.number().optional(),
          contractNumber: z.string().optional(),
          projectTitle: z.string().min(1),
          clientName: z.string().optional(),
          contractAmount: z.string().optional(),
          startDate: z.string().optional(),
          originalCompletionDate: z.string().optional(),
          status: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createContractHistory({
          ...input,
          startDate: input.startDate ? new Date(input.startDate) : null,
          originalCompletionDate: input.originalCompletionDate ? new Date(input.originalCompletionDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a contract history
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          contractNumber: z.string().optional(),
          projectTitle: z.string().optional(),
          clientName: z.string().optional(),
          contractAmount: z.string().optional(),
          startDate: z.string().optional(),
          originalCompletionDate: z.string().optional(),
          actualCompletionDate: z.string().optional(),
          status: z.string().optional(),
          timeExtensions: z.number().optional(),
          extensionDays: z.number().optional(),
          variationOrders: z.number().optional(),
          variationAmount: z.string().optional(),
          finalAmount: z.string().optional(),
          performanceRating: z.string().optional(),
          liquidatedDamages: z.string().optional(),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, startDate, originalCompletionDate, actualCompletionDate, ...rest } = input;
        return updateContractHistory(id, {
          ...rest,
          startDate: startDate ? new Date(startDate) : null,
          originalCompletionDate: originalCompletionDate ? new Date(originalCompletionDate) : null,
          actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : null,
        });
      }),

    // Delete a contract history
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteContractHistory(input.id);
      }),
  }),

  // Performance Ratings routes
  performanceRatings: router({
    // List performance ratings
    list: publicProcedure
      .input(
        z.object({
          contractorId: z.number().optional(),
          contractHistoryId: z.number().optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getPerformanceRatings(input ?? {});
      }),

    // Get single performance rating by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getPerformanceRatingById(input.id);
      }),

    // Create a new performance rating
    create: protectedProcedure
      .input(
        z.object({
          contractorId: z.number(),
          contractHistoryId: z.number().optional(),
          projectId: z.number().optional(),
          evaluationPeriod: z.string().optional(),
          qualityRating: z.string().optional(),
          timelinessRating: z.string().optional(),
          safetyRating: z.string().optional(),
          resourceRating: z.string().optional(),
          communicationRating: z.string().optional(),
          evaluatorName: z.string().optional(),
          evaluatorPosition: z.string().optional(),
          evaluationDate: z.string().optional(),
          strengths: z.string().optional(),
          areasForImprovement: z.string().optional(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createPerformanceRating({
          ...input,
          evaluationDate: input.evaluationDate ? new Date(input.evaluationDate) : null,
          createdById: ctx.user.id,
        });
      }),

    // Update a performance rating
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          evaluationPeriod: z.string().optional(),
          qualityRating: z.string().optional(),
          timelinessRating: z.string().optional(),
          safetyRating: z.string().optional(),
          resourceRating: z.string().optional(),
          communicationRating: z.string().optional(),
          evaluatorName: z.string().optional(),
          evaluatorPosition: z.string().optional(),
          evaluationDate: z.string().optional(),
          strengths: z.string().optional(),
          areasForImprovement: z.string().optional(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, evaluationDate, ...rest } = input;
        return updatePerformanceRating(id, {
          ...rest,
          evaluationDate: evaluationDate ? new Date(evaluationDate) : null,
        });
      }),

    // Delete a performance rating
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePerformanceRating(input.id);
      }),
  }),

  // User management routes (admin only)
  users: router({
    // List users with filters (admin only)
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
          role: z.enum(['user', 'admin']).optional(),
          division: z.enum(['Admin', 'Planning', 'Construction', 'Quality', 'Maintenance']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        // Only admins can list users
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can access user management');
        }
        return getUsers(input ?? {});
      }),

    // Get single user by ID (admin only)
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can access user management');
        }
        return getUserById(input.id);
      }),

    // Get user statistics (admin only)
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Only admins can access user management');
      }
      return getUserStats();
    }),

    // Approve a user (admin only)
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can approve users');
        }
        return approveUser(input.id, ctx.user.id);
      }),

    // Reject a user (admin only)
    reject: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can reject users');
        }
        return rejectUser(input.id, ctx.user.id, input.reason);
      }),

    // Update user role (admin only)
    updateRole: protectedProcedure
      .input(z.object({ id: z.number(), role: z.enum(['user', 'admin']) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can update user roles');
        }
        return updateUserRole(input.id, input.role);
      }),

    // Update user details (admin only)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          division: z.enum(['Admin', 'Planning', 'Construction', 'Quality', 'Maintenance']).nullable().optional(),
          position: z.string().nullable().optional(),
          isDivisionHead: z.boolean().optional(),
          role: z.enum(['user', 'admin']).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can update user details');
        }
        const { id, ...data } = input;
        return updateUserDetails(id, data);
      }),

    // Delete a user (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Only admins can delete users');
        }
        // Prevent self-deletion
        if (ctx.user.id === input.id) {
          throw new Error('Cannot delete your own account');
        }
        return deleteUser(input.id);
      }),
  }),

  // Provincial Roads routes (Maintenance Division)
  roads: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          municipality: z.string().optional(),
          roadCondition: z.enum(['Good', 'Fair', 'Poor', 'Bad']).optional(),
          sortBy: z.enum(['roadId', 'roadName', 'municipality', 'length', 'condition']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getProvincialRoads(input ?? {});
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProvincialRoadById(input.id);
      }),

    municipalities: publicProcedure.query(async () => {
      return getRoadMunicipalities();
    }),

    stats: publicProcedure.query(async () => {
      return getRoadStats();
    }),
  }),

  // Maintenance Equipment routes
  equipment: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          equipmentType: z.enum(['Heavy Equipment', 'Vehicle', 'Tool', 'Other']).optional(),
          status: z.enum(['Available', 'In Use', 'Under Maintenance', 'Out of Service']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getMaintenanceEquipment(input ?? {});
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getEquipmentById(input.id);
      }),

    stats: publicProcedure.query(async () => {
      return getEquipmentStats();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          equipmentType: z.enum(['Heavy Equipment', 'Vehicle', 'Tool', 'Other']).optional(),
          equipmentCode: z.string().optional(),
          model: z.string().optional(),
          plateNumber: z.string().optional(),
          status: z.enum(['Available', 'In Use', 'Under Maintenance', 'Out of Service']).optional(),
          currentLocation: z.string().optional(),
          operatorName: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createEquipment(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          equipmentType: z.enum(['Heavy Equipment', 'Vehicle', 'Tool', 'Other']).optional(),
          equipmentCode: z.string().optional(),
          model: z.string().optional(),
          plateNumber: z.string().optional(),
          status: z.enum(['Available', 'In Use', 'Under Maintenance', 'Out of Service']).optional(),
          currentLocation: z.string().optional(),
          operatorName: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateEquipment(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteEquipment(input.id);
      }),
  }),

  // Maintenance Schedules routes
  schedules: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          roadId: z.number().optional(),
          maintenanceType: z.enum(['Vegetation Control', 'Pothole Patching', 'Grading', 'Drainage Cleaning', 'Road Rehabilitation', 'Emergency Repair', 'Routine Inspection', 'Other']).optional(),
          status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed']).optional(),
          priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getMaintenanceSchedules(input ?? {});
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getScheduleById(input.id);
      }),

    stats: publicProcedure.query(async () => {
      return getScheduleStats();
    }),

    create: protectedProcedure
      .input(
        z.object({
          roadId: z.number().optional(),
          title: z.string().min(1),
          maintenanceType: z.enum(['Vegetation Control', 'Pothole Patching', 'Grading', 'Drainage Cleaning', 'Road Rehabilitation', 'Emergency Repair', 'Routine Inspection', 'Other']).optional(),
          priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
          scheduledStartDate: z.string().optional(),
          scheduledEndDate: z.string().optional(),
          estimatedCost: z.number().optional(),
          assignedTeam: z.string().optional(),
          kmStart: z.number().optional(),
          kmEnd: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createSchedule({ ...input, createdById: ctx.user?.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          roadId: z.number().optional(),
          title: z.string().optional(),
          maintenanceType: z.enum(['Vegetation Control', 'Pothole Patching', 'Grading', 'Drainage Cleaning', 'Road Rehabilitation', 'Emergency Repair', 'Routine Inspection', 'Other']).optional(),
          priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
          scheduledStartDate: z.string().optional(),
          scheduledEndDate: z.string().optional(),
          actualStartDate: z.string().optional(),
          actualEndDate: z.string().optional(),
          status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed']).optional(),
          estimatedCost: z.number().optional(),
          actualCost: z.number().optional(),
          assignedTeam: z.string().optional(),
          kmStart: z.number().optional(),
          kmEnd: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSchedule(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSchedule(input.id);
      }),
  }),

  // Equipment Assignments routes
  assignments: router({
    list: publicProcedure
      .input(
        z.object({
          scheduleId: z.number().optional(),
          equipmentId: z.number().optional(),
          status: z.enum(['Assigned', 'Active', 'Completed', 'Returned']).optional(),
          page: z.number().min(1).optional(),
          limit: z.number().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getEquipmentAssignments(input ?? {});
      }),

    create: protectedProcedure
      .input(
        z.object({
          scheduleId: z.number(),
          equipmentId: z.number(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          operatorName: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createEquipmentAssignment(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          operatorName: z.string().optional(),
          hoursUsed: z.number().optional(),
          fuelConsumed: z.number().optional(),
          status: z.enum(['Assigned', 'Active', 'Completed', 'Returned']).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateEquipmentAssignment(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteEquipmentAssignment(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
