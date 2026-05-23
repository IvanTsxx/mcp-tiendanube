import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

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

// Service interface for dependency injection
interface ProductServiceInterface {
  list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    stock_status?: "all" | "in_stock" | "out_of_stock";
  }): Promise<{
    products: {
      id: string;
      name: string;
      description: string;
      price: string;
      stock: number;
      variants_count: number;
      variants: {
        id: string;
        sku: string;
        price: string;
        stock: number;
      }[];
      images: { id: string; src: string; position: number }[];
    }[];
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  }>;
}

// Factory function to set service (allows testing with mock)
let productService: ProductServiceInterface | null = null;

export function setProductService(service: ProductServiceInterface): void {
  productService = service;
}

export default async function listProducts(params: Params) {
  if (!productService) {
    throw new Error(
      "ProductService not configured. Call setProductService() first."
    );
  }

  const { stock_status, search, page } = params;

  const result = await productService.list({
    page,
    per_page: 50,
    search,
    stock_status,
  });

  return {
    pagination: result.pagination,
    products: result.products,
  };
}
