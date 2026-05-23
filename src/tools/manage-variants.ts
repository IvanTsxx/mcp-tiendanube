import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { ProductIdSchema, VariantInputSchema } from "../domain/models/product";

export const schema = {
  action: z
    .enum(["create", "update", "delete"])
    .describe("The action to perform on the variant"),
  product_id: ProductIdSchema.describe("The product ID"),
  variant: VariantInputSchema.optional().describe(
    "Variant data for create/update actions"
  ),
  variant_id: z
    .string()
    .optional()
    .describe("The variant ID for update/delete actions"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    readOnlyHint: false,
    title: "Manage Product Variants",
  },
  description:
    "Create, update, or delete variants within a product. For create: provide product_id and variant data. For update: provide variant_id and updated fields. For delete: provide variant_id.",
  name: "manage-variants",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

interface VariantServiceInterface {
  create(
    productId: string,
    variant: { sku?: string; price?: string; stock?: number }
  ): Promise<{ id: string; sku: string; price: string; stock: number }>;
  update(
    variantId: string,
    body: Partial<{ sku: string; price: string; stock: number }>
  ): Promise<{ id: string; sku: string; price: string; stock: number }>;
  delete(variantId: string): Promise<void>;
}

let variantService: VariantServiceInterface | null = null;

export function setVariantService(service: VariantServiceInterface): void {
  variantService = service;
}

export default async function manageVariants(params: Params) {
  if (!variantService) {
    throw new Error(
      "VariantService not configured. Call setVariantService() first."
    );
  }

  const { product_id, action, variant, variant_id } = params;

  switch (action) {
    case "create": {
      if (!variant) {
        throw new Error("Variant data required for create action");
      }
      const created = await variantService.create(product_id, variant);
      return { action: "created", success: true, variant: created };
    }

    case "update": {
      if (!variant_id) {
        throw new Error("variant_id required for update action");
      }
      const updated = await variantService.update(variant_id, variant ?? {});
      return { action: "updated", success: true, variant: updated };
    }

    case "delete": {
      if (!variant_id) {
        throw new Error("variant_id required for delete action");
      }
      await variantService.delete(variant_id);
      return { action: "deleted", success: true, variant_id };
    }

    default: {
      throw new Error(`Unknown action: ${action}`);
    }
  }
}
