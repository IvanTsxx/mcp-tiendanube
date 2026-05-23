import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let manageVariants: any;
let metadata: any;
let schema: any;
let mockService: any;

function createMockVariantService(
  overrides: {
    createResponse?: { id: string; sku: string; price: string; stock: number };
    updateResponse?: { id: string; sku: string; price: string; stock: number };
    deleteResponse?: void;
    createError?: Error;
    updateError?: Error;
    deleteError?: Error;
  } = {}
) {
  return {
    create: async (
      productId: string,
      variant: { sku?: string; price?: string; stock?: number }
    ) => {
      if (overrides.createError) {
        throw overrides.createError;
      }
      return (
        overrides.createResponse ?? {
          id: "new-var",
          sku: variant.sku ?? "",
          price: variant.price ?? "0.00",
          stock: variant.stock ?? 0,
        }
      );
    },
    update: async (
      variantId: string,
      body: Partial<{ sku: string; price: string; stock: number }>
    ) => {
      if (overrides.updateError) {
        throw overrides.updateError;
      }
      return (
        overrides.updateResponse ?? {
          id: variantId,
          sku: body.sku ?? "",
          price: body.price ?? "0.00",
          stock: body.stock ?? 0,
        }
      );
    },
    delete: async (variantId: string) => {
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

  const mod = await import("../../tools/manage-variants");
  manageVariants = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("manage-variants tool", () => {
  beforeEach(() => {
    mockService = createMockVariantService();
  });

  test("schema has correct structure", () => {
    expect(schema.action).toBeDefined();
    expect(schema.product_id).toBeDefined();
    expect(schema.variant).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("manage-variants");
    expect(metadata.annotations?.destructiveHint).toBe(true);
  });

  test("tool creates variant when action is create", async () => {
    mockService = createMockVariantService({
      createResponse: {
        id: "new-123",
        sku: "SKU-NEW",
        price: "29.99",
        stock: 10,
      },
    });

    const result = await manageVariants({
      action: "create",
      product_id: "prod-123",
      variant: { sku: "SKU-NEW", price: "29.99", stock: 10 },
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.action).toBe("created");
    expect(result.structuredContent.variant?.id).toBe("new-123");
  });

  test("tool updates variant when action is update", async () => {
    mockService = createMockVariantService({
      updateResponse: {
        id: "var-123",
        sku: "SKU-UPD",
        price: "39.99",
        stock: 20,
      },
    });

    const result = await manageVariants({
      action: "update",
      product_id: "prod-123",
      variant: { price: "39.99" },
      variant_id: "var-123",
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.action).toBe("updated");
  });

  test("tool deletes variant when action is delete", async () => {
    const result = await manageVariants({
      action: "delete",
      product_id: "prod-123",
      variant_id: "var-123",
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.action).toBe("deleted");
  });

  test("tool requires variant_id for update action", async () => {
    await expect(
      manageVariants({
        action: "update",
        product_id: "prod-123",
        variant: { price: "19.99" },
      } as never)
    ).rejects.toThrow("variant_id required");
  });
});
