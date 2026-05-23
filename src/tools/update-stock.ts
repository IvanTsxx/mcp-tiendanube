import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { createStockServiceInstance } from "../services/factory";

export const schema = {
  variant_stock: z
    .array(
      z.object({
        stock: z
          .number()
          .int()
          .min(0)
          .describe("New stock level (must be >= 0)"),
        variant_id: z.string().describe("The variant ID"),
      })
    )
    .min(1)
    .describe("Array of stock level updates for variants"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    readOnlyHint: false,
    title: "Update Stock Levels",
  },
  description:
    "Update stock levels for one or more variants in a single operation. Validates that stock values are non-negative before applying.",
  name: "update-stock",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

export default async function updateStock(params: Params) {
  const stockService = createStockServiceInstance();

  const results = await stockService.updateStock(params.variant_stock);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    structuredContent: {
      results,
      summary: {
        failed: failureCount,
        success: successCount,
        total: results.length,
      },
    },
  };
}
