import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let updateStock: any;
let metadata: any;
let schema: any;
let mockService: any;

function createMockStockService(
  overrides: {
    updateStockResponse?: {
      variant_id: string;
      success: boolean;
      stock?: number;
      error?: string;
    }[];
    updateStockError?: Error;
  } = {}
) {
  return {
    updateStock: async (updates: { variant_id: string; stock: number }[]) => {
      if (overrides.updateStockError) {
        throw overrides.updateStockError;
      }
      return (
        overrides.updateStockResponse ??
        updates.map((u) => ({
          variant_id: u.variant_id,
          success: true,
          stock: u.stock,
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

  const mod = await import("../../tools/update-stock");
  updateStock = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("update-stock tool", () => {
  beforeEach(() => {
    mockService = createMockStockService();
  });

  test("schema has correct structure", () => {
    expect(schema.variant_stock).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("update-stock");
  });

  test("tool returns results with summary", async () => {
    mockService = createMockStockService({
      updateStockResponse: [
        { variant_id: "var-1", success: true, stock: 100 },
        { variant_id: "var-2", success: true, stock: 50 },
      ],
    });

    const result = await updateStock({
      variant_stock: [
        { variant_id: "var-1", stock: 100 },
        { variant_id: "var-2", stock: 50 },
      ],
    });

    expect(result.results).toHaveLength(2);
    expect(result.summary.total).toBe(2);
    expect(result.summary.success).toBe(2);
  });

  test("tool handles partial failures", async () => {
    mockService = createMockStockService({
      updateStockResponse: [
        { variant_id: "var-1", success: true, stock: 100 },
        { variant_id: "var-2", success: false, error: "Variant not found" },
      ],
    });

    const result = await updateStock({
      variant_stock: [
        { variant_id: "var-1", stock: 100 },
        { variant_id: "var-2", stock: 50 },
      ],
    });

    expect(result.summary.success).toBe(1);
    expect(result.summary.failed).toBe(1);
  });

  test("schema requires at least one stock update", () => {
    const parseResult = schema.variant_stock.safeParse([]);
    expect(parseResult.success).toBe(false);
  });
});
