import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { ProductIdSchema, ProductUpdateSchema } from "../domain/models/product";
import { createProductServiceInstance } from "../services/factory";

export const schema = {
  updates: z
    .array(
      z.object({
        id: ProductIdSchema,
        updates: ProductUpdateSchema,
      })
    )
    .min(1)
    .describe("Array of product updates to apply"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    readOnlyHint: false,
    title: "Update Products",
  },
  description:
    "Bulk update product attributes. Each update specifies a product ID and the fields to change. Valid items are processed even if some items fail validation.",
  name: "update-products",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

export default async function updateProducts(params: Params) {
  const productService = createProductServiceInstance();

  const results = await productService.updateBulk(params.updates);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    results,
    summary: {
      failed: failureCount,
      success: successCount,
      total: results.length,
    },
  };
}
