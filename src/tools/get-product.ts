import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { ProductIdSchema } from "../domain/models/product";
import { createProductServiceInstance } from "../services/factory";

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

export default async function getProduct(params: Params) {
  const productService = createProductServiceInstance();

  const product = await productService.get(params.id);

  return {
    structuredContent: { product },
  };
}
