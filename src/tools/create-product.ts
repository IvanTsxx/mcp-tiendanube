import type { ToolMetadata, InferSchema } from "xmcp";

import { ProductCreateSchema } from "../domain/models/product";
import { createProductServiceInstance } from "../services/factory";

export const schema = {
  product: ProductCreateSchema.describe("The product data to create"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    readOnlyHint: false,
    title: "Create Product",
  },
  description:
    "Create a new product in the store. Supports atomic creation of product base along with its variants, attributes, and images in a single call.",
  name: "create-product",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

export default async function createProduct(params: Params) {
  const productService = createProductServiceInstance();

  const created = await productService.create(params.product);

  return {
    structuredContent: {
      product: created,
      success: true,
    },
  };
}
