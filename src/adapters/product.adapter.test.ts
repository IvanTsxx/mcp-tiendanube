import { test, expect } from "bun:test";

import type { Pagination } from "../domain/models/pagination";
import type { Product, ProductUpdate } from "../domain/models/product";
import type { ProductAdapter } from "./product.adapter";

// Create a mock adapter for testing ProductAdapter interface
function createMockAdapter(
  overrides: Partial<{
    listResponse: TiendanubeListResponse;
    getResponse: TiendanubeProductResponse;
    updateResponse: TiendanubeProductResponse;
    deleteResponse: void;
    listError: Error;
    getError: Error;
    updateError: Error;
    deleteError: Error;
  }> = {}
) {
  return {
    delete: async (path: string): Promise<void> => {
      if (path.startsWith("/products/")) {
        if (overrides.deleteError) {
          throw overrides.deleteError;
        }
        return overrides.deleteResponse as any;
      }
    },
    get: async <T>(
      path: string,
      _params?: Record<string, string>
    ): Promise<T> => {
      if (path.startsWith("/products/") && !path.includes("fields")) {
        const id = path.split("/products/")[1];
        if (overrides.getError) {
          throw overrides.getError;
        }
        return overrides.getResponse as T;
      }
      if (path.startsWith("/products/") && path.includes("fields")) {
        if (overrides.getError) {
          throw overrides.getError;
        }
        return overrides.getResponse as T;
      }
      if (path === "/products") {
        if (overrides.listError) {
          throw overrides.listError;
        }
        return overrides.listResponse as T;
      }
      return {} as T;
    },
    post: async <T>(_path: string, _body: unknown): Promise<T> => ({}),
    put: async <T>(path: string, _body: unknown): Promise<T> => {
      if (path.startsWith("/products/")) {
        if (overrides.updateError) {
          throw overrides.updateError;
        }
        return overrides.updateResponse as T;
      }
      return {} as T;
    },
  };
}

// Types for mock responses
interface TiendanubeProductResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  variants_count: number;
  variants: { id: number; sku: string; price: string; stock: number }[];
  images: { id: number; src: string; position: number }[];
}

interface TiendanubeListResponse {
  products: TiendanubeProductResponse[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Test that createProductAdapter returns correct interface
test("ProductAdapter has list, get, update, delete methods", () => {
  const mockAdapter = createMockAdapter();
  const { createProductAdapter } = require("./product.adapter");
  const productAdapter = createProductAdapter(mockAdapter as any);

  expect(typeof productAdapter.list).toBe("function");
  expect(typeof productAdapter.get).toBe("function");
  expect(typeof productAdapter.update).toBe("function");
  expect(typeof productAdapter.delete).toBe("function");
});

test("ProductAdapter.list returns products and pagination", async () => {
  const mockResponse: TiendanubeListResponse = {
    pagination: {
      page: 1,
      per_page: 50,
      total: 1,
      total_pages: 1,
    },
    products: [
      {
        description: "A test product",
        id: 123,
        images: [{ id: 1, src: "https://example.com/img.jpg", position: 1 }],
        name: "Test Product",
        price: "29.99",
        stock: 10,
        variants: [
          { id: 1, sku: "SKU-001", price: "29.99", stock: 5 },
          { id: 2, sku: "SKU-002", price: "24.99", stock: 5 },
        ],
        variants_count: 2,
      },
    ],
  };

  const mockAdapter = createMockAdapter({ listResponse: mockResponse });
  const { createProductAdapter } = require("./product.adapter");
  const productAdapter = createProductAdapter(mockAdapter as any);

  const result = await productAdapter.list();

  expect(result.products).toHaveLength(1);
  expect(result.products[0].name).toBe("Test Product");
  expect(result.pagination.total).toBe(1);
  expect(result.pagination.page).toBe(1);
});

test("ProductAdapter.get returns full product with variants and images", async () => {
  const mockProduct: TiendanubeProductResponse = {
    description: "Has variants and images",
    id: 123,
    images: [
      { id: 1, position: 1, src: "https://example.com/1.jpg" },
      { id: 2, position: 2, src: "https://example.com/2.jpg" },
    ],
    name: "Full Product",
    price: "49.99",
    stock: 20,
    variants: [
      { id: 1, price: "49.99", sku: "V1", stock: 10 },
      { id: 2, price: "44.99", sku: "V2", stock: 7 },
      { id: 3, price: "39.99", sku: "V3", stock: 3 },
    ],
    variants_count: 3,
  };

  const mockAdapter = createMockAdapter({ getResponse: mockProduct });
  const { createProductAdapter } = require("./product.adapter");
  const productAdapter = createProductAdapter(mockAdapter as any);

  const result = await productAdapter.get("123");

  expect(result.name).toBe("Full Product");
  expect(result.variants).toHaveLength(3);
  expect(result.images).toHaveLength(2);
  expect(result.variants[0].sku).toBe("V1");
  expect(result.images[0].src).toBe("https://example.com/1.jpg");
});

test("ProductAdapter transforms numeric IDs to string branded types", async () => {
  const mockProduct: TiendanubeProductResponse = {
    description: "Testing ID transformation",
    id: 456,
    images: [{ id: 101, position: 1, src: "https://example.com/test.jpg" }],
    name: "ID Transform Test",
    price: "19.99",
    stock: 5,
    variants: [{ id: 789, price: "19.99", sku: "VAR-789", stock: 5 }],
    variants_count: 1,
  };

  const mockAdapter = createMockAdapter({ getResponse: mockProduct });
  const { createProductAdapter } = require("./product.adapter");
  const productAdapter = createProductAdapter(mockAdapter as any);

  const result = await productAdapter.get("456");

  expect(result.id).toBe("456");
  expect(result.variants[0].id).toBe("789");
  expect(result.images[0].id).toBe("101");
  // Verify they are strings
  expect(typeof result.id).toBe("string");
  expect(typeof result.variants[0].id).toBe("string");
  expect(typeof result.images[0].id).toBe("string");
});
