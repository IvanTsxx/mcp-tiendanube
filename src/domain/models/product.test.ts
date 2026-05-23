import { test, expect } from "bun:test";

import {
  ProductSchema,
  VariantSchema,
  ImageSchema,
  ProductIdSchema,
  VariantIdSchema,
  ImageIdSchema,
} from "./product";

test("ProductSchema parses valid product with branded IDs", () => {
  const validProduct = {
    description: "A test product description",
    id: "123",
    images: [{ id: "img1", position: 1, src: "https://example.com/img1.jpg" }],
    name: "Test Product",
    price: "29.99",
    stock: 10,
    variants: [
      { id: "v1", price: "29.99", sku: "SKU-001", stock: 5 },
      { id: "v2", price: "24.99", sku: "SKU-002", stock: 5 },
    ],
    variants_count: 2,
  };

  const result = ProductSchema.parse(validProduct);
  expect(result.name).toBe("Test Product");
  // IDs are branded types - verify they exist and are truthy
  expect(result.id).toBeTruthy();
  expect(typeof result.id).toBe("string");
  expect(result.variants).toHaveLength(2);
  expect(result.images).toHaveLength(1);
});

test("ProductSchema rejects invalid price format", () => {
  const invalidProduct = {
    description: "desc",
    id: "123",
    images: [],
    name: "Test",
    price: "not-a-number",
    stock: 10,
    variants: [],
    variants_count: 0,
  };

  expect(() => ProductSchema.parse(invalidProduct)).toThrow();
});

test("ProductSchema rejects negative stock", () => {
  const invalidProduct = {
    description: "desc",
    id: "123",
    images: [],
    name: "Test",
    price: "10.00",
    stock: -5,
    variants: [],
    variants_count: 0,
  };

  expect(() => ProductSchema.parse(invalidProduct)).toThrow();
});

test("VariantSchema parses valid variant", () => {
  const validVariant = {
    id: "v1",
    price: "19.99",
    sku: "SKU-001",
    stock: 10,
  };

  const result = VariantSchema.parse(validVariant);
  expect(result.sku).toBe("SKU-001");
  expect(result.stock).toBe(10);
});

test("VariantSchema rejects missing sku", () => {
  const invalidVariant = {
    id: "v1",
    price: "19.99",
    stock: 10,
  };

  expect(() => VariantSchema.parse(invalidVariant)).toThrow();
});

test("ImageSchema parses valid image", () => {
  const validImage = {
    id: "img1",
    position: 1,
    src: "https://example.com/image.jpg",
  };

  const result = ImageSchema.parse(validImage);
  expect(result.src).toBe("https://example.com/image.jpg");
  expect(result.position).toBe(1);
});

test("ImageSchema rejects invalid url", () => {
  const invalidImage = {
    id: "img1",
    position: 1,
    src: "not-a-valid-url",
  };

  expect(() => ImageSchema.parse(invalidImage)).toThrow();
});

test("ProductIdSchema branded type works", () => {
  const result = ProductIdSchema.safeParse("123");
  expect(result.success).toBe(true);
});

test("VariantIdSchema branded type works", () => {
  const result = VariantIdSchema.safeParse("v1");
  expect(result.success).toBe(true);
});

test("ImageIdSchema branded type works", () => {
  const result = ImageIdSchema.safeParse("img1");
  expect(result.success).toBe(true);
});

test("ProductSchema applies defaults", () => {
  const minimalProduct = {
    description: "desc",
    id: "123",
    name: "Test",
    price: "10.00",
    stock: 0,
    variants_count: 0,
  };

  const result = ProductSchema.parse(minimalProduct);
  expect(result.variants).toEqual([]);
  expect(result.images).toEqual([]);
});
