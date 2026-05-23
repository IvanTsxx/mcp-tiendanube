import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let deleteProduct: any;
let metadata: any;
let schema: any;
let mockService: any;

function createMockProductService(
  overrides: {
    deleteResponse?: void;
    deleteError?: Error;
  } = {}
) {
  return {
    delete: async (id: string, confirm: true) => {
      if (overrides.deleteError) {
        throw overrides.deleteError;
      }
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

  const mod = await import("../../tools/delete-product");
  deleteProduct = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("delete-product tool", () => {
  beforeEach(() => {
    mockService = createMockProductService();
  });

  test("schema has correct structure", () => {
    expect(schema.product_id).toBeDefined();
    expect(schema.confirm).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("delete-product");
    expect(metadata.annotations?.destructiveHint).toBe(true);
  });

  test("tool deletes product when confirm is true", async () => {
    const result = await deleteProduct({
      product_id: "prod-123",
      confirm: true,
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.deleted as string).toBe("prod-123");
  });

  test("tool returns error when confirm is not true", async () => {
    const result = await deleteProduct({
      product_id: "prod-123",
      confirm: false,
    } as never);

    expect(result.structuredContent.success).toBe(false);
    expect(result.structuredContent.error).toContain("confirm: true");
  });

  test("schema confirm field requires boolean", () => {
    const parseResult = schema.confirm.safeParse(true);
    expect(parseResult.success).toBe(true);
  });
});
