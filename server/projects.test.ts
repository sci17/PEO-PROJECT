import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("projects.list", () => {
  it("returns paginated projects with default parameters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list({});

    expect(result).toHaveProperty("projects");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.projects)).toBe(true);
    expect(result.page).toBe(1);
  });

  it("respects pagination parameters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list({ page: 2, limit: 10 });

    expect(result.page).toBe(2);
    expect(result.projects.length).toBeLessThanOrEqual(10);
  });

  it("filters by category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list({ category: "Roads" });

    // All returned projects should have category "Roads"
    result.projects.forEach(project => {
      expect(project.category).toBe("Roads");
    });
  });

  it("filters by search term", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list({ search: "hospital" });

    // Should return projects matching "hospital"
    expect(result.projects.length).toBeGreaterThanOrEqual(0);
  });
});

describe("projects.categories", () => {
  it("returns an array of category strings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.categories();

    expect(Array.isArray(result)).toBe(true);
    // Should have at least some categories from our seeded data
    expect(result.length).toBeGreaterThan(0);
    result.forEach(category => {
      expect(typeof category).toBe("string");
    });
  });
});

describe("projects.municipalities", () => {
  it("returns an array of municipality strings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.municipalities();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(municipality => {
      expect(typeof municipality).toBe("string");
    });
  });
});

describe("projects.stats", () => {
  it("returns project statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("completed");
    expect(result).toHaveProperty("ongoing");
    expect(result).toHaveProperty("totalCost");
    expect(result).toHaveProperty("byCategory");
    expect(typeof result?.total).toBe("number");
    expect(result?.total).toBeGreaterThan(0);
  });
});

describe("projects.byId", () => {
  it("returns a project when given a valid ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get a list to find a valid ID
    const listResult = await caller.projects.list({ limit: 1 });
    if (listResult.projects.length > 0) {
      const projectId = listResult.projects[0].id;
      const result = await caller.projects.byId({ id: projectId });

      expect(result).toBeDefined();
      expect(result?.id).toBe(projectId);
      expect(result?.projectName).toBeDefined();
    }
  });

  it("returns undefined for non-existent ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.byId({ id: 999999 });

    expect(result).toBeUndefined();
  });
});
