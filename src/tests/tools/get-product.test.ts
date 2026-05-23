import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let getProduct: any;
let metadata: any;
let schema: any;
let mockService: any;

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

beforeAll(async () => {
  mock.module("../../services/factory", () => ({
    createImageServiceInstance: () => mockService,
    createProductServiceInstance: () => mockService,
    createStockServiceInstance: () => mockService,
    createVariantServiceInstance: () => mockService,
  }));

  const mod = await import("../../tools/get-product");
  getProduct = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("get-product tool", () => {
  beforeEach(() => {
    mockService = createMockProductService({});
  });

  test("schema has correct id field", () => {
    expect(schema.id).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("get-product");
    expect(metadata.annotations?.readOnlyHint).toBe(true);
  });

  test("tool returns product", async () => {
    mockService = createMockProductService({
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

    const result = await getProduct({ id: "123" } as never);

    expect(result.product).toBeDefined();
    expect(result.product.name).toBe("Test Product");
  });

  test("tool propagates service errors", async () => {
    mockService = createMockProductService({
      getError: new Error("Not found"),
    });

    await expect(getProduct({ id: "999" } as never)).rejects.toThrow(
      "Not found"
    );
  });
});
