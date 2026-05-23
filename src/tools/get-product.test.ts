import { test, expect, describe } from "bun:test";

import getProduct, { metadata, schema, setProductService } from "./get-product";

function createMockProductService(overrides: {
  getResponse?: {
    id: string;
    name: string;
    description: string;
    price: string;
    stock: number;
    variants_count: number;
    variants: { id: string; sku: string; price: string; stock: number }[];
    images: { id: string; src: string; position: number }[];
  };
  getError?: Error;
}) {
  return {
    get: async (id: string) => {
      if (overrides.getError) {
        throw overrides.getError;
      }
      return (
        overrides.getResponse ?? {
          id,
          name: "Test Product",
          description: "Test description",
          price: "29.99",
          stock: 10,
          variants_count: 1,
          variants: [],
          images: [],
        }
      );
    },
  };
}

describe("get-product tool", () => {
  test("schema has correct id field", () => {
    expect(schema.id).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("get-product");
    expect(metadata.annotations?.readOnlyHint).toBe(true);
  });

  test("tool returns product when service configured", async () => {
    const mockService = createMockProductService({
      getResponse: {
        id: "123",
        name: "Test Product",
        description: "A test product",
        price: "29.99",
        stock: 10,
        variants_count: 2,
        variants: [{ id: "v1", sku: "SKU-001", price: "29.99", stock: 5 }],
        images: [
          { id: "img1", src: "https://example.com/img.jpg", position: 1 },
        ],
      },
    });

    setProductService(mockService as never);

    const result = await getProduct({ id: "123" });

    expect(result.product).toBeDefined();
    expect(result.product.name).toBe("Test Product");
  });

  test("tool throws error when service not configured", async () => {
    setProductService(null as never);

    await expect(getProduct({ id: "123" })).rejects.toThrow(
      "ProductService not configured"
    );
  });

  test("tool propagates service errors", async () => {
    const mockService = createMockProductService({
      getError: new Error("Not found"),
    });

    setProductService(mockService as never);

    await expect(getProduct({ id: "999" })).rejects.toThrow("Not found");
  });
});
