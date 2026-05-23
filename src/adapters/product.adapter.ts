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

function transformListResponse(
  response: any,
  requestedParams: { page?: number; per_page?: number } = {}
): {
  products: Product[];
  pagination: Pagination;
} {
  const page = requestedParams.page ?? 1;
  const per_page = requestedParams.per_page ?? 50;

  if (response && !Array.isArray(response) && response.pagination) {
    return {
      pagination: {
        page: response.pagination.page ?? page,
        per_page: response.pagination.per_page ?? per_page,
        total: response.pagination.total ?? 0,
        total_pages: response.pagination.total_pages ?? 0,
      },
      products: (response.products || []).map(transformProductResponse),
    };
  }

  const productsArray = Array.isArray(response) ? response : [];
  const productsCount = productsArray.length;
  const hasMore = productsCount === per_page;
  const estimatedTotal = hasMore
    ? page * per_page + 1
    : (page - 1) * per_page + productsCount;
  const estimatedTotalPages = hasMore ? page + 1 : page;

  return {
    pagination: {
      page,
      per_page,
      total: estimatedTotal,
      total_pages: estimatedTotalPages,
    },
    products: productsArray.map(transformProductResponse),
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
        `/products/${id}`
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

      const response = await adapter.get<any>("/products", queryParams);

      return transformListResponse(response, {
        page: params.page,
        per_page: params.per_page,
      });
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
