import { test, expect, describe } from "bun:test";

import manageVariants, {
  metadata,
  schema,
  setVariantService,
} from "./manage-variants";

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

describe("manage-variants tool", () => {
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
    const mockService = createMockVariantService({
      createResponse: {
        id: "new-123",
        sku: "SKU-NEW",
        price: "29.99",
        stock: 10,
      },
    });

    setVariantService(mockService as never);

    const result = await manageVariants({
      action: "create",
      product_id: "prod-123",
      variant: { sku: "SKU-NEW", price: "29.99", stock: 10 },
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("created");
    expect(result.variant.id).toBe("new-123");
  });

  test("tool updates variant when action is update", async () => {
    const mockService = createMockVariantService({
      updateResponse: {
        id: "var-123",
        sku: "SKU-UPD",
        price: "39.99",
        stock: 20,
      },
    });

    setVariantService(mockService as never);

    const result = await manageVariants({
      action: "update",
      product_id: "prod-123",
      variant: { price: "39.99" },
      variant_id: "var-123",
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("updated");
  });

  test("tool deletes variant when action is delete", async () => {
    const mockService = createMockVariantService();

    setVariantService(mockService as never);

    const result = await manageVariants({
      action: "delete",
      product_id: "prod-123",
      variant_id: "var-123",
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("deleted");
  });

  test("tool throws error when service not configured", async () => {
    setVariantService(null as never);

    await expect(
      manageVariants({
        action: "create",
        product_id: "prod-123",
        variant: { sku: "TEST" },
      })
    ).rejects.toThrow("VariantService not configured");
  });

  test("tool requires variant_id for update action", async () => {
    const mockService = createMockVariantService();

    setVariantService(mockService as never);

    await expect(
      manageVariants({
        action: "update",
        product_id: "prod-123",
        variant: { price: "19.99" },
      })
    ).rejects.toThrow("variant_id required");
  });
});
