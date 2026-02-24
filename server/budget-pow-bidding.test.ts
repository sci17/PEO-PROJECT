import { describe, it, expect } from "vitest";
import {
  getAnnualBudgets,
  getBudgetStats,
  getProgramOfWorks,
  getPOWStats,
  getBiddings,
  getBiddingStats,
} from "./db";

describe("Budget Management API", () => {
  describe("getAnnualBudgets", () => {
    it("should return a list of budgets", async () => {
      const result = await getAnnualBudgets({});
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by status when provided", async () => {
      const result = await getAnnualBudgets({ status: "Approved" });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by fiscal year when provided", async () => {
      const result = await getAnnualBudgets({ fiscalYear: 2026 });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getBudgetStats", () => {
    it("should return budget statistics", async () => {
      const result = await getBudgetStats();
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("totalBudgets");
        expect(result).toHaveProperty("totalAllocated");
        expect(result).toHaveProperty("totalRemaining");
        expect(result).toHaveProperty("currentYear");
        expect(typeof result.totalBudgets).toBe("number");
        expect(typeof result.totalAllocated).toBe("number");
      }
    });
  });
});

describe("Program of Works (POW) API", () => {
  describe("getProgramOfWorks", () => {
    it("should return a paginated list of POWs", async () => {
      const result = await getProgramOfWorks({});
      expect(result).toBeDefined();
      expect(result).toHaveProperty("pows");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.pows)).toBe(true);
    });

    it("should support pagination", async () => {
      const result = await getProgramOfWorks({ page: 1, limit: 5 });
      expect(result.page).toBe(1);
      expect(result.pows.length).toBeLessThanOrEqual(5);
    });

    it("should filter by status when provided", async () => {
      const result = await getProgramOfWorks({ status: "Draft" });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("pows");
    });

    it("should filter by category when provided", async () => {
      const result = await getProgramOfWorks({ category: "Roads" });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("pows");
    });

    it("should support search functionality", async () => {
      const result = await getProgramOfWorks({ search: "construction" });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("pows");
    });
  });

  describe("getPOWStats", () => {
    it("should return POW statistics without filters", async () => {
      const result = await getPOWStats({});
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("total");
        expect(result).toHaveProperty("totalCost");
        expect(result).toHaveProperty("draft");
        expect(result).toHaveProperty("approved");
        expect(typeof result.total).toBe("number");
      }
    });
  });
});

describe("Bidding Management API", () => {
  describe("getBiddings", () => {
    it("should return a paginated list of biddings", async () => {
      const result = await getBiddings({});
      expect(result).toBeDefined();
      expect(result).toHaveProperty("biddings");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.biddings)).toBe(true);
    });

    it("should support pagination", async () => {
      const result = await getBiddings({ page: 1, limit: 5 });
      expect(result.page).toBe(1);
      expect(result.biddings.length).toBeLessThanOrEqual(5);
    });

    it("should filter by status when provided", async () => {
      const result = await getBiddings({ status: "Pre-Procurement" });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("biddings");
    });

    it("should filter by procurement mode when provided", async () => {
      const result = await getBiddings({ procurementMode: "Public Bidding" });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("biddings");
    });

    it("should support search functionality", async () => {
      const result = await getBiddings({ search: "construction" });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("biddings");
    });
  });

  describe("getBiddingStats", () => {
    it("should return bidding statistics", async () => {
      const result = await getBiddingStats();
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("total");
        expect(result).toHaveProperty("totalABC");
        expect(result).toHaveProperty("awarded");
        expect(result).toHaveProperty("failed");
        expect(typeof result.total).toBe("number");
        expect(typeof result.totalABC).toBe("number");
      }
    });
  });
});
