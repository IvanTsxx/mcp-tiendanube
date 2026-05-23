import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let updateProducts: any;
let metadata: any;
let schema: any;
let mockService: any;

function createMockProductService(overrides: {
  updateBulkResponse?: {
    id: string;
    success: boolean;
    product?: unknown;
    error?: string;
  }[];
  updateBulkError?: Error;
}) {
  return {
    updateBulk: async (
      items: { id: string; updates: Record<string, unknown> }[]
    ) => {
      if (overrides.updateBulkError) {
        throw overrides.updateBulkError;
      }
      return (
        overrides.updateBulkResponse ??
        items.map((item) => ({
          id: item.id,
          success: true,
          product: { id: item.id, name: "Updated" },
        }))
      );
    },
  };
}

beforeAll(async () => {
  mock.module("../../services/factory", () => ({
    createImageServiceInstance: () => mockService,
    createProductServiceInstance: () => mockService,
    createStockServiceInstance: () => mockService,
    createVariantServiceInstance: () => mockService,
  }));

  const mod = await import("../../tools/update-products");
  updateProducts = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("update-products tool", () => {
  beforeEach(() => {
    mockService = createMockProductService({});
  });

  test("schema has correct structure", () => {
    expect(schema.updates).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("update-products");
    expect(metadata.annotations?.readOnlyHint).toBe(false);
  });

  test("tool returns results with summary", async () => {
    mockService = createMockProductService({
      updateBulkResponse: [
        { id: "123", success: true, product: { id: "123", name: "Updated" } },
        { id: "456", success: true },
      ],
    });

    const result = await updateProducts({
      updates: [
        { id: "123", updates: { name: "Updated Product" } },
        { id: "456", updates: { price: "39.99" } },
      ],
    } as never);

    expect(result.results).toHaveLength(2);
    expect(result.summary.total).toBe(2);
    expect(result.summary.success).toBe(2);
  });

  test("schema requires at least one update", () => {
    const parseResult = schema.updates.safeParse([]);
    expect(parseResult.success).toBe(false);
  });
});
