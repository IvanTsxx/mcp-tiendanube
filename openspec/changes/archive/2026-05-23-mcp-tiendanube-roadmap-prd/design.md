# Design: product-crud — Tiendanube Product Lifecycle MCP Server

## Technical Approach

Implement 7 task-oriented MCP tools that bridge xmcp to Tiendanube's REST API v1 using a strict 4-layer architecture: `tools → services → adapters → API client`. Each tool validates input via Zod v4, delegates to a typed service, which calls the Tiendanube adapter, which wraps `Bun.fetch` with auth headers and retry logic. No auth logic — token comes from `.env` at startup.

## Architecture Decisions

### Decision: Layer boundaries are import-protected

**Choice**: Each layer may only import from the layer directly below it. `domain/` has zero dependencies and is imported by all layers.

**Alternatives considered**: Allowing ad-hoc cross-layer imports for convenience (rejected — creates coupling that blocks testing and refactoring).

**Rationale**: Spec requirement and enables TDD — services can be tested by mocking adapters, tools by mocking services.

---

### Decision: Bun.fetch for HTTP client

**Choice**: Use native `Bun.fetch` with a thin wrapper for headers and timeouts.

**Alternatives considered**: `undici` (adds a dependency), `axios` (too heavy, Node-specific).

**Rationale**: Bun-native, zero-dependency, sufficient for REST calls with retries.

---

### Decision: Branded types for Tiendanube IDs

**Choice**: Use Zod branded types (`type ProductId = string & { readonly __brand: "ProductId" }`) for all Tiendanube resource IDs.

**Alternatives considered**: Plain strings (accepts any string, risk of mixing IDs).

**Rationale**: Catches `productId` passed where `variantId` expected at compile time. Spec requires type safety.

---

### Decision: One test file per module, co-located

**Choice**: `src/services/product.service.test.ts` lives next to `src/services/product.service.ts`.

**Alternatives considered**: Central `tests/` directory (rejected — obscures relationship).

**Rationale**: TDD convention from skill, matches existing `greet.test.ts` pattern.

---

## Data Flow

```
LLM → xmcp dispatcher → tool handler
                              ↓
                         Zod validate
                              ↓
                         Service layer (business logic)
                              ↓
                         Adapter layer (Tiendanube API mapping)
                              ↓
                         Bun.fetch HTTP client
                              ↓
                         Tiendanube REST API v1
```

**Tool → Service → Adapter → API** — strict downward flow only.

## File Changes

| File                                 | Action | Description                                                                 |
| ------------------------------------ | ------ | --------------------------------------------------------------------------- |
| `src/domain/models/product.ts`       | Create | Product, Variant, Image, Stock types + Zod schemas                          |
| `src/domain/models/pagination.ts`    | Create | Pagination DTO types                                                        |
| `src/domain/errors.ts`               | Create | Centralized error types (TiendaNubeError, ValidationError, NotFoundError)   |
| `src/config/env.ts`                  | Create | Typed env config (TokenConfig interface)                                    |
| `src/adapters/tiendanube.adapter.ts` | Create | API client: auth headers, retry with exponential backoff, error mapping     |
| `src/adapters/product.adapter.ts`    | Create | Product API mapping: GET /products, PUT, DELETE                             |
| `src/adapters/variant.adapter.ts`    | Create | Variant API mapping: POST /variants, PUT, DELETE                            |
| `src/adapters/image.adapter.ts`      | Create | Image API mapping: POST /images, DELETE                                     |
| `src/services/product.service.ts`    | Create | ProductService: list, get, update, delete                                   |
| `src/services/variant.service.ts`    | Create | VariantService: create, update, delete                                      |
| `src/services/image.service.ts`      | Create | ImageService: add, remove, reorder                                          |
| `src/services/stock.service.ts`      | Create | StockService: update variant stock levels                                   |
| `src/tools/list-products.ts`         | Create | `list-products` tool                                                        |
| `src/tools/get-product.ts`           | Create | `get-product` tool                                                          |
| `src/tools/update-products.ts`       | Create | `update-products` tool                                                      |
| `src/tools/manage-variants.ts`       | Create | `manage-variants` tool                                                      |
| `src/tools/manage-images.ts`         | Create | `manage-images` tool                                                        |
| `src/tools/update-stock.ts`          | Create | `update-stock` tool                                                         |
| `src/tools/delete-product.ts`        | Create | `delete-product` tool                                                       |
| `src/tools/list-products.test.ts`    | Create | ProductService tests (bun test)                                             |
| `src/tools/get-product.test.ts`      | Create | ProductService.get tests                                                    |
| `src/tools/update-products.test.ts`  | Create | ProductService.update tests                                                 |
| `src/tools/manage-variants.test.ts`  | Create | VariantService tests                                                        |
| `src/tools/manage-images.test.ts`    | Create | ImageService tests                                                          |
| `src/tools/update-stock.test.ts`     | Create | StockService tests                                                          |
| `src/tools/delete-product.test.ts`   | Create | ProductService.delete tests                                                 |
| `.env.example`                       | Create | `TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID`, `TIENDANUBE_API_BASE_URL` |

## Interfaces / Contracts

### Domain Models (src/domain/models/)

```typescript
// Product with variants and images flattened for LLM consumption
export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  variants_count: number;
  variants: Variant[];
  images: Image[];
}

export interface Variant {
  id: number;
  sku: string;
  price: string;
  stock: number;
}

export interface Image {
  id: number;
  src: string;
  position: number;
}

export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

### Tool Schema Example (Zod v4)

```typescript
// src/tools/list-products.ts
export const schema = {
  stock_status: z
    .enum(["all", "in_stock", "out_of_stock"])
    .default("all")
    .describe("Filter by stock availability"),
  search: z.string().optional().describe("Search by product name"),
  page: z.coerce.number().int().min(1).default(1).describe("Page number"),
};

export const metadata: ToolMetadata = {
  name: "list-products",
  description: "List products from the store with optional filters",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    destructiveHint: false,
  },
};
```

### Adapter Interface

```typescript
// src/adapters/tiendanube.adapter.ts
export interface TiendaNubeAdapter {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}
```

### Error Types

```typescript
// src/domain/errors.ts
export class TiendaNubeError extends Error {
  constructor(message: string, code: string, httpStatus: number) {
    super(message);
  }
}

export class NotFoundError extends TiendaNubeError {
  constructor(resource: string, id: string | number) {
    super(`Resource not found`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends Error {
  constructor(issues: ZodError["issues"]) {
    super("Validation failed");
  }
}
```

## Testing Strategy

| Layer   | What to Test                                    | Approach                                           |
| ------- | ----------------------------------------------- | -------------------------------------------------- |
| Domain  | Zod schemas parse valid/invalid input correctly | Unit tests with `expect()` assertions              |
| Adapter | HTTP response → normalized domain object        | Mock `Bun.fetch` via `bun$Mock` in `beforeEach`    |
| Service | Business logic, error mapping, pagination       | Integration-style tests via public service methods |
| Tools   | Schema validation, service orchestration        | Unit tests calling tool function directly          |

**Mock strategy**: Only mock `Bun.fetch` in adapter tests. Services and tools are tested with real domain objects. No mocking of internal collaborators.

**Coverage gate**: ≥80% for new code (enforced by CI).

## Migration / Rollout

No migration required. MCP server is stateless — no Tiendanube data stored locally.

## Open Questions

- [ ] **Rate limit delay values**: Spec mentions 1s, 2s, 4s delays for 429 backoff — should these be configurable via env?
- [ ] **User-Agent format**: Tiendanube requires `MyApp (name@email.com)` — confirm format and whether it should be configurable.
- [ ] **Max bulk update size**: `update-products` accepts an array — should there be a max batch size (e.g., 50) to avoid hitting payload limits?
