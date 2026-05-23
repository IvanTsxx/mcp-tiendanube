import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { ProductIdSchema } from "../domain/models/product";

export const schema = {
  id: ProductIdSchema.describe("The unique product ID from Tiendanube"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    readOnlyHint: true,
    title: "Get Product Details",
  },
  description:
    "Get complete product details including all variants and images. Returns the full product resource tree.",
  name: "get-product",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

interface ProductServiceInterface {
  get(id: string): Promise<{
    id: string;
    name: string;
    description: string;
    price: string;
    stock: number;
    variants_count: number;
    variants: { id: string; sku: string; price: string; stock: number }[];
    images: { id: string; src: string; position: number }[];
  }>;
}

let productService: ProductServiceInterface | null = null;

export function setProductService(service: ProductServiceInterface): void {
  productService = service;
}

export default async function getProduct(params: Params) {
  if (!productService) {
    throw new Error(
      "ProductService not configured. Call setProductService() first."
    );
  }

  const product = await productService.get(params.id);

  return { product };
}
