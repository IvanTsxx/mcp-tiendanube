import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let createProduct: any;
let metadata: any;
let schema: any;
let mockService: any;

function createMockProductService(overrides: {
  createResponse?: {
    id: string;
    name: string;
    description: string;
    price: string;
    stock: number;
    variants_count: number;
    variants: { id: string; sku: string; price: string; stock: number }[];
    images: { id: string; src: string; position: number }[];
  };
  createError?: Error;
}) {
  return {
    create: async (product: any) => {
      if (overrides.createError) {
        throw overrides.createError;
      }
      return (
        overrides.createResponse ?? {
          id: "new-prod-123",
          name:
            typeof product.name === "string"
              ? product.name
              : product.name?.es || "Test Product",
          description:
            typeof product.description === "string"
              ? product.description
              : product.description?.es || "Test description",
          price: product.price ?? "29.99",
          stock: product.stock ?? 10,
          variants_count: product.variants?.length ?? 1,
          variants: (product.variants || []).map((v: any, idx: number) => ({
            id: `v-${idx}`,
            sku: v.sku ?? `sku-${idx}`,
            price: v.price,
            stock: v.stock,
          })),
          images: (product.images || []).map((img: any, idx: number) => ({
            id: `img-${idx}`,
            src: img.src,
            position: img.position ?? idx + 1,
          })),
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

  const mod = await import("../../tools/create-product");
  createProduct = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("create-product tool", () => {
  beforeEach(() => {
    mockService = createMockProductService({});
  });

  test("schema has correct structure", () => {
    expect(schema.product).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("create-product");
    expect(metadata.annotations?.readOnlyHint).toBe(false);
  });

  test("tool creates simple product", async () => {
    mockService = createMockProductService({
      createResponse: {
        id: "prod-123",
        name: "Simple Product",
        description: "Simple desc",
        price: "29.99",
        stock: 10,
        variants_count: 1,
        variants: [],
        images: [],
      },
    });

    const result = await createProduct({
      product: {
        name: "Simple Product",
        description: "Simple desc",
        price: "29.99",
        stock: 10,
      },
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.product.id).toBe("prod-123");
    expect(result.structuredContent.product.name).toBe("Simple Product");
  });

  test("tool creates complex product with variants", async () => {
    const result = await createProduct({
      product: {
        name: { es: "Complex Product" },
        description: { es: "Complex desc" },
        attributes: ["Size"],
        variants: [
          { values: ["S"], price: "29.99", stock: 5 },
          { values: ["M"], price: "34.99", stock: 10 },
        ],
        images: [{ src: "https://example.com/img.jpg" }],
      },
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.product.variants).toHaveLength(2);
    expect(result.structuredContent.product.images).toHaveLength(1);
  });

  test("tool propagates service errors", async () => {
    mockService = createMockProductService({
      createError: new Error("Validation error on backend"),
    });

    await expect(
      createProduct({
        product: { name: "Error product" },
      } as never)
    ).rejects.toThrow("Validation error on backend");
  });
});
