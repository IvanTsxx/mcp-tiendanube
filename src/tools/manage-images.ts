import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { ProductIdSchema } from "../domain/models/product";
import { createImageServiceInstance } from "../services/factory";

export const schema = {
  action: z
    .enum(["add", "remove", "reorder"])
    .describe("The action to perform"),
  image_id: z
    .string()
    .optional()
    .describe("Image ID for remove/reorder actions"),
  image_url: z.string().url().optional().describe("Image URL for add action"),
  position: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Position for reorder action"),
  product_id: ProductIdSchema.describe("The product ID"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    readOnlyHint: false,
    title: "Manage Product Images",
  },
  description:
    "Add, remove, or reorder product images. Add requires image_url. Remove requires image_id. Reorder requires image_id and position.",
  name: "manage-images",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

export default async function manageImages(params: Params) {
  const imageService = createImageServiceInstance();

  const { product_id, action, image_url, image_id, position } = params;

  switch (action) {
    case "add": {
      if (!image_url) {
        throw new Error("image_url required for add action");
      }
      const added = await imageService.add(product_id, image_url);
      return {
        structuredContent: { action: "added", image: added, success: true },
      };
    }

    case "remove": {
      if (!image_id) {
        throw new Error("image_id required for remove action");
      }
      await imageService.remove(image_id);
      return {
        structuredContent: { action: "removed", image_id, success: true },
      };
    }

    case "reorder": {
      if (!image_id || position === undefined) {
        throw new Error("image_id and position required for reorder action");
      }
      const reordered = await imageService.reorder(image_id, position);
      return {
        structuredContent: {
          action: "reordered",
          image: reordered,
          success: true,
        },
      };
    }

    default: {
      throw new Error(`Unknown action: ${action}`);
    }
  }
}
