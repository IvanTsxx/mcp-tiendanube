import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let listProducts: any;
let schema: any;
let metadata: any;
let mockService: any;

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

beforeAll(async () => {
  mock.module("../../services/factory", () => ({
    createImageServiceInstance: () => mockService,
    createProductServiceInstance: () => mockService,
    createStockServiceInstance: () => mockService,
    createVariantServiceInstance: () => mockService,
  }));

  const mod = await import("../../tools/list-products");
  listProducts = mod.default;
  schema = mod.schema;
  metadata = mod.metadata;
});

describe("list-products tool", () => {
  beforeEach(() => {
    mockService = createMockProductService();
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

  test("tool returns paginated products", async () => {
    mockService = createMockProductService({
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
    mockService = createMockProductService({
      listResponse: {
        pagination: { page: 1, per_page: 50, total: 0, total_pages: 0 },
        products: [],
      },
    });

    const result = await listProducts({
      page: 1,
      search: "shoes",
      stock_status: "all",
    });

    expect(result.products).toEqual([]);
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
