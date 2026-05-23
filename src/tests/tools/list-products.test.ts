import { test, expect, describe, beforeEach } from "bun:test";

import listProducts, {
  schema,
  metadata,
  setProductService,
} from "../../tools/list-products";

// Mock product service for testing
function createMockProductService(
  overrides: {
    listResponse?: {
      products: {
        id: string;
        name: string;
        description: string;
        price: string;
        stock: number;
        variants_count: number;
        variants: {
          id: string;
          sku: string;
          price: string;
          stock: number;
        }[];
        images: { id: string; src: string; position: number }[];
      }[];
      pagination: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
      };
    };
    listError?: Error;
  } = {}
) {
  return {
    list: async (params?: any) => {
      if (overrides.listError) {
        throw overrides.listError;
      }
      return (
        overrides.listResponse ?? {
          pagination: { page: 1, per_page: 50, total: 0, total_pages: 0 },
          products: [],
        }
      );
    },
  };
}

describe("list-products tool", () => {
  beforeEach(() => {
    // Reset service before each test
  });

  test("schema has correct structure", () => {
    expect(schema.stock_status).toBeDefined();
    expect(schema.search).toBeDefined();
    expect(schema.page).toBeDefined();
  });

  test("metadata has correct name and annotations", () => {
    expect(metadata.name).toBe("list-products");
    expect(metadata.annotations?.readOnlyHint).toBe(true);
    expect(metadata.annotations?.idempotentHint).toBe(true);
    expect(metadata.annotations?.destructiveHint).toBe(false);
  });

  test("tool returns paginated products when service configured", async () => {
    const mockService = createMockProductService({
      listResponse: {
        pagination: {
          page: 1,
          per_page: 50,
          total: 1,
          total_pages: 1,
        },
        products: [
          {
            description: "A test product",
            id: "123",
            images: [
              { id: "img1", src: "https://example.com/img.jpg", position: 1 },
            ],
            name: "Test Product",
            price: "29.99",
            stock: 10,
            variants: [{ id: "v1", sku: "SKU-001", price: "29.99", stock: 5 }],
            variants_count: 2,
          },
        ],
      },
    });

    setProductService(mockService as any);

    const result = await listProducts({
      page: 1,
      search: undefined,
      stock_status: "all",
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe("Test Product");
    expect(result.pagination.total).toBe(1);
  });

  test("tool accepts optional search parameter", async () => {
    const mockService = createMockProductService({
      listResponse: {
        pagination: { page: 1, per_page: 50, total: 0, total_pages: 0 },
        products: [],
      },
    });

    setProductService(mockService as any);

    const result = await listProducts({
      page: 1,
      search: "shoes",
      stock_status: "all",
    });

    expect(result.products).toEqual([]);
  });

  test("tool throws error when service not configured", async () => {
    // Reset service to null
    setProductService(null as any);

    await expect(
      listProducts({ page: 1, search: undefined, stock_status: "all" })
    ).rejects.toThrow("ProductService not configured");
  });

  test("schema stock_status enum has correct values", () => {
    const parseResult = schema.stock_status.safeParse("in_stock");
    expect(parseResult.success).toBe(true);

    const parseResult2 = schema.stock_status.safeParse("out_of_stock");
    expect(parseResult2.success).toBe(true);

    const parseResult3 = schema.stock_status.safeParse("all");
    expect(parseResult3.success).toBe(true);

    const parseResult4 = schema.stock_status.safeParse("invalid");
    expect(parseResult4.success).toBe(false);
  });

  test("schema page has default value", () => {
    const result = schema.page.parse(undefined as never);
    expect(result).toBe(1);
  });
});
