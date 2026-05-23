import type { Pagination } from "../domain/models/pagination";
import type { Product, ProductUpdate } from "../domain/models/product";
import {
  ProductIdSchema,
  VariantIdSchema,
  ImageIdSchema,
} from "../domain/models/product";
import type { TiendaNubeAdapter } from "./tiendanube.adapter";

// Tiendanube API response shapes
interface TiendanubeProductResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  variants_count: number;
  variants: {
    id: number;
    sku: string;
    price: string;
    stock: number;
  }[];
  images: {
    id: number;
    src: string;
    position: number;
  }[];
}

interface TiendanubeListResponse {
  products: TiendanubeProductResponse[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

function transformProductResponse(
  apiProduct: TiendanubeProductResponse
): Product {
  return {
    description: apiProduct.description,
    id: ProductIdSchema.parse(String(apiProduct.id)),
    images: apiProduct.images.map((img) => ({
      id: ImageIdSchema.parse(String(img.id)),
      position: img.position,
      src: img.src,
    })),
    name: apiProduct.name,
    price: apiProduct.price,
    stock: apiProduct.stock,
    variants: apiProduct.variants.map((v) => ({
      id: VariantIdSchema.parse(String(v.id)),
      price: v.price,
      sku: v.sku,
      stock: v.stock,
    })),
    variants_count: apiProduct.variants_count,
  };
}

function transformListResponse(response: TiendanubeListResponse): {
  products: Product[];
  pagination: Pagination;
} {
  return {
    pagination: {
      page: response.pagination.page,
      per_page: response.pagination.per_page,
      total: response.pagination.total,
      total_pages: response.pagination.total_pages,
    },
    products: response.products.map(transformProductResponse),
  };
}

export interface ProductAdapter {
  list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    stock_status?: "all" | "in_stock" | "out_of_stock";
  }): Promise<{ products: Product[]; pagination: Pagination }>;
  get(id: string): Promise<Product>;
  update(id: string, updates: ProductUpdate): Promise<Product>;
  delete(id: string): Promise<void>;
}

export function createProductAdapter(
  adapter: TiendaNubeAdapter
): ProductAdapter {
  return {
    async delete(id: string) {
      await adapter.delete(`/products/${id}`);
    },

    async get(id: string) {
      const response = await adapter.get<TiendanubeProductResponse>(
        `/products/${id}`,
        { fields: "**" }
      );
      return transformProductResponse(response);
    },

    async list(params = {}) {
      const queryParams: Record<string, string> = {
        page: String(params.page ?? 1),
        per_page: String(params.per_page ?? 50),
      };

      if (params.search) {
        queryParams.search = params.search;
      }

      if (params.stock_status && params.stock_status !== "all") {
        queryParams.stock = params.stock_status === "in_stock" ? "1" : "0";
      }

      const response = await adapter.get<TiendanubeListResponse>(
        "/products",
        queryParams
      );

      return transformListResponse(response);
    },

    async update(id: string, updates: ProductUpdate) {
      const response = await adapter.put<TiendanubeProductResponse>(
        `/products/${id}`,
        updates
      );
      return transformProductResponse(response);
    },
  };
}
