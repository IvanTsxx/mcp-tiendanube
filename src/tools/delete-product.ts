import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { ProductIdSchema } from "../domain/models/product";
import { createProductServiceInstance } from "../services/factory";

export const schema = {
  confirm: z
    .boolean()
    .describe(
      "Must be true to confirm deletion. Without confirmation, the operation is rejected."
    ),
  product_id: ProductIdSchema.describe("The product ID to delete"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    readOnlyHint: false,
    title: "Delete Product",
  },
  description:
    "Delete a product from the store. Requires confirm: true to prevent accidental deletions. This action is destructive and cannot be undone.",
  name: "delete-product",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

export default async function deleteProduct(params: Params) {
  const productService = createProductServiceInstance();

  const { product_id, confirm } = params;

  if (confirm !== true) {
    return {
      structuredContent: {
        error:
          "Deletion requires confirm: true. Please confirm the deletion before proceeding.",
        success: false,
      },
    };
  }

  await productService.delete(product_id, true);

  return {
    structuredContent: {
      deleted: product_id,
      success: true,
    },
  };
}
