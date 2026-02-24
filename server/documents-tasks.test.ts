import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

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

describe("documents router", () => {
  it("documents.list returns paginated results", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.documents.list({ page: 1, limit: 10 });

    expect(result).toHaveProperty("documents");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.documents)).toBe(true);
  });

  it("documents.stats returns statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.documents.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("forReview");
    expect(result).toHaveProperty("routed");
    expect(result).toHaveProperty("open");
    expect(typeof result.total).toBe("number");
  });
});

describe("tasks router", () => {
  it("tasks.list returns paginated results", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.list({ page: 1, limit: 10 });

    expect(result).toHaveProperty("tasks");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.tasks)).toBe(true);
  });

  it("tasks.stats returns statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("inProgress");
    expect(result).toHaveProperty("completed");
    expect(result).toHaveProperty("overdue");
    expect(typeof result.total).toBe("number");
  });
});

describe("projects router", () => {
  it("projects.list returns paginated results", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list({ page: 1, limit: 10 });

    expect(result).toHaveProperty("projects");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.projects)).toBe(true);
  });

  it("projects.stats returns statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("completed");
    expect(result).toHaveProperty("ongoing");
    expect(result).toHaveProperty("totalCost");
    expect(typeof result.total).toBe("number");
  });
});
