import { test, expect, describe } from "bun:test";

import updateProducts, {
  metadata,
  schema,
  setProductService,
} from "./update-products";

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

describe("update-products tool", () => {
  test("schema has correct structure", () => {
    expect(schema.updates).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("update-products");
    expect(metadata.annotations?.readOnlyHint).toBe(false);
  });

  test("tool returns results with summary when service configured", async () => {
    const mockService = createMockProductService({
      updateBulkResponse: [
        { id: "123", success: true, product: { id: "123", name: "Updated" } },
        { id: "456", success: true },
      ],
    });

    setProductService(mockService as never);

    const result = await updateProducts({
      updates: [
        { id: "123", updates: { name: "Updated Product" } },
        { id: "456", updates: { price: "39.99" } },
      ],
    });

    expect(result.results).toHaveLength(2);
    expect(result.summary.total).toBe(2);
    expect(result.summary.success).toBe(2);
  });

  test("tool throws error when service not configured", async () => {
    setProductService(null as never);

    await expect(
      updateProducts({
        updates: [{ id: "123", updates: { name: "Test" } }],
      })
    ).rejects.toThrow("ProductService not configured");
  });

  test("schema requires at least one update", () => {
    const parseResult = schema.updates.safeParse([]);
    expect(parseResult.success).toBe(false);
  });
});
