// Pagination types for paginated API responses

export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// List products query params
export interface ListProductsParams {
  page?: number;
  per_page?: number;
  fields?: string;
  search?: string;
  stock_status?: "all" | "in_stock" | "out_of_stock";
}
