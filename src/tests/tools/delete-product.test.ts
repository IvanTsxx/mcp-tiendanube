import { test, expect, describe } from "bun:test";

import deleteProduct, {
  metadata,
  schema,
  setProductService,
} from "../../tools/delete-product";

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

describe("delete-product tool", () => {
  test("schema has correct structure", () => {
    expect(schema.product_id).toBeDefined();
    expect(schema.confirm).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("delete-product");
    expect(metadata.annotations?.destructiveHint).toBe(true);
  });

  test("tool deletes product when confirm is true", async () => {
    const mockService = createMockProductService();

    setProductService(mockService as never);

    const result = await deleteProduct({
      product_id: "prod-123",
      confirm: true,
    } as never);

    expect(result.success).toBe(true);
    expect(result.deleted as string).toBe("prod-123");
  });

  test("tool returns error when confirm is not true", async () => {
    const mockService = createMockProductService();

    setProductService(mockService as never);

    const result = await deleteProduct({
      product_id: "prod-123",
      confirm: false,
    } as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain("confirm: true");
  });

  test("tool throws error when service not configured", async () => {
    setProductService(null as never);

    await expect(
      deleteProduct({ product_id: "prod-123", confirm: true } as never)
    ).rejects.toThrow("ProductService not configured");
  });

  test("schema confirm field requires boolean", () => {
    const parseResult = schema.confirm.safeParse(true);
    expect(parseResult.success).toBe(true);
  });
});
