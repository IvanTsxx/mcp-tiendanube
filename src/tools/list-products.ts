import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

import { createProductServiceInstance } from "../services/factory";

export const schema = {
  page: z.coerce.number().int().min(1).default(1).describe("Page number"),
  search: z.string().optional().describe("Search by product name"),
  stock_status: z
    .enum(["all", "in_stock", "out_of_stock"])
    .default("all")
    .describe("Filter by stock availability"),
};

export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    readOnlyHint: true,
    title: "List Products",
  },
  description:
    "List products from the store with optional filters. Returns paginated results with up to 50 products per page.",
  name: "list-products",
};

type Schema = typeof schema;
type Params = InferSchema<Schema>;

export default async function listProducts(params: Params = {} as Params) {
  const productService = createProductServiceInstance();

  const { stock_status, search, page } = params || {};

  const result = await productService.list({
    page,
    per_page: 50,
    search,
    stock_status,
  });

  console.log(result);

  return {
    structuredContent: {
      pagination: result.pagination,
      products: result.products,
    },
  };
}
