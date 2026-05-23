# Tasks: mcp-tiendanube-roadmap-prd — Product CRUD MCP Server

## Review Workload Forecast

| Field                   | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| Estimated changed lines | 1,800–2,200                                                   |
| 400-line budget risk    | High                                                          |
| Chained PRs recommended | Yes                                                           |
| Suggested split         | PR 1 (Foundation) → PR 2 (Adapters) → PR 3 (Services + Tools) |
| Delivery strategy       | ask-on-risk                                                   |
| Chain strategy          | pending                                                       |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                   | Likely PR     | Notes                                       |
| ---- | ------------------------------------------------------ | ------------- | ------------------------------------------- |
| 1    | Foundation: domain types, config, HTTP client skeleton | PR 1 → `main` | Base adapter must work before service layer |
| 2    | Adapters: product, variant, image adapters with tests  | PR 2 → PR 1   | Depends on PR 1; isolated per-resource      |
| 3    | Services + Tools: all 7 tools wired to services        | PR 3 → PR 2   | Final integration; TDD for each tool        |

## Phase 1: Foundation — Domain, Config, HTTP Client

- [ ] 1.1 Create `src/domain/models/product.ts` with `Product`, `Variant`, `Image` interfaces + Zod schemas using branded types (`ProductId`, `VariantId`, `ImageId`)
- [ ] 1.2 Create `src/domain/models/pagination.ts` with `Pagination` interface
- [ ] 1.3 Create `src/domain/errors.ts` with `TiendaNubeError`, `NotFoundError`, `ValidationError`, `UnauthorizedError` classes
- [ ] 1.4 Create `src/config/env.ts` with `TokenConfig` interface reading `TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID`, `TIENDANUBE_API_BASE_URL` from `process.env`; export typed config singleton
- [ ] 1.5 Create `.env.example` with `TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID`, `TIENDANUBE_API_BASE_URL` placeholders
- [ ] 1.6 RED: Write `src/domain/models/product.test.ts` — test Zod schema parses valid/invalid Product payloads
- [ ] 1.7 GREEN: Fix `product.ts` until test passes
- [ ] 1.8 RED: Write `src/config/env.test.ts` — test config loads from `process.env` and throws on missing required vars
- [ ] 1.9 GREEN: Fix `env.ts` until test passes

## Phase 2: Adapters — Tiendanube HTTP Client + Resource Adapters

- [ ] 2.1 Create `src/adapters/tiendanube.adapter.ts` — `TiendaNubeAdapter` interface + `createAdapter(config)` factory; Bun.fetch wrapper with auth headers (`Authorization: Bearer`), User-Agent header, 30s timeout, exponential backoff (1s, 2s, 4s) on HTTP 429, error mapping (401 → `UnauthorizedError`, 404 → `NotFoundError`, 5xx → `TiendaNubeError`)
- [ ] 2.2 RED: Write `src/adapters/tiendanube.adapter.test.ts` — mock `Bun.fetch` via `bun$Mock`; test 429 backoff, 401 error mapping, 404 NotFound, successful GET/POST/PUT/DELETE
- [ ] 2.3 GREEN: Implement `tiendanube.adapter.ts` until tests pass
- [ ] 2.4 Create `src/adapters/product.adapter.ts` — `ProductAdapter` with `list(params)`, `get(id)`, `update(id, body)`, `delete(id)` methods calling Tiendanube `/products` endpoints; transforms raw API response to domain `Product[]`
- [ ] 2.5 RED: Write `src/adapters/product.adapter.test.ts` — mock fetch; test `list` returns normalized products with pagination, `get` returns full product with variants/images, `update` sends correct PUT body, `delete` returns void
- [ ] 2.6 GREEN: Implement `product.adapter.ts` until tests pass
- [ ] 2.7 Create `src/adapters/variant.adapter.ts` — `VariantAdapter` with `create(productId, variant)`, `update(variantId, body)`, `delete(variantId)` methods
- [ ] 2.8 RED: Write `src/adapters/variant.adapter.test.ts` — mock fetch; test create returns created variant with ID, update merges fields, delete returns void
- [ ] 2.9 GREEN: Implement `variant.adapter.ts` until tests pass
- [ ] 2.10 Create `src/adapters/image.adapter.ts` — `ImageAdapter` with `add(productId, imageUrl)`, `remove(imageId)`, `reorder(imageId, position)` methods
- [ ] 2.11 RED: Write `src/adapters/image.adapter.test.ts` — mock fetch; test `add` posts correct URL and returns Image, `remove` deletes by ID, `reorder` updates position
- [ ] 2.12 GREEN: Implement `image.adapter.ts` until tests pass

## Phase 3: Services — Business Logic Layer

- [ ] 3.1 Create `src/services/product.service.ts` — `ProductService` using `TiendaNubeAdapter`; `list(filters)`, `get(id)`, `updateBulk(updates[])`, `delete(id, confirm)` methods; maps adapter results to domain types
- [ ] 3.2 RED: Write `src/services/product.service.test.ts` — integration-style tests; test `list` with stock filter, `get` throws `NotFoundError` for unknown ID, `updateBulk` skips invalid items, `delete` requires `confirm: true`
- [ ] 3.3 GREEN: Implement `product.service.ts` until tests pass
- [ ] 3.4 Create `src/services/variant.service.ts` — `VariantService` using `VariantAdapter`; `create(productId, variant)`, `update(variantId, body)`, `delete(variantId)` methods
- [ ] 3.5 RED: Write `src/services/variant.service.test.ts` — test `create` returns variant with Tiendanube ID, `delete` throws on unknown variant
- [ ] 3.6 GREEN: Implement `variant.service.ts` until tests pass
- [ ] 3.7 Create `src/services/image.service.ts` — `ImageService` using `ImageAdapter`; `add(productId, imageUrl)`, `remove(imageId)`, `reorder(imageId, position)` methods
- [ ] 3.8 RED: Write `src/services/image.service.test.ts` — test `add` returns new image with src, `remove` returns void
- [ ] 3.9 GREEN: Implement `image.service.ts` until tests pass
- [ ] 3.10 Create `src/services/stock.service.ts` — `StockService` using `VariantAdapter`; `updateStock(variantStock[])` method; validates `stock >= 0` before API call
- [ ] 3.11 RED: Write `src/services/stock.service.test.ts` — test bulk stock update, negative stock rejected by Zod
- [ ] 3.12 GREEN: Implement `stock.service.ts` until tests pass

## Phase 4: Tools — xmcp Tool Definitions

- [ ] 4.1 Create `src/tools/list-products.ts` — export `schema` (Zod: `stock_status`, `search`, `page`) + `metadata` (`ToolMetadata`, name `list-products`, readOnlyHint) + default handler calling `ProductService.list()`
- [ ] 4.2 RED: Write `src/tools/list-products.test.ts` — test schema validation, handler calls service and returns paginated result
- [ ] 4.3 GREEN: Implement handler until test passes
- [ ] 4.4 Create `src/tools/get-product.ts` — schema: `{ id: ProductId branded }`, metadata name `get-product`; handler calls `ProductService.get()`
- [ ] 4.5 RED: Write `src/tools/get-product.test.ts` — test schema with valid/invalid ID, handler returns product with variants/images
- [ ] 4.6 GREEN: Implement until test passes
- [ ] 4.7 Create `src/tools/update-products.ts` — schema: `{ updates: [{ id, partial<Product> }] }`, metadata name `update-products`; handler calls `ProductService.updateBulk()`
- [ ] 4.8 RED: Write `src/tools/update-products.test.ts` — test partial validation failure, bulk success path
- [ ] 4.9 GREEN: Implement until test passes
- [ ] 4.10 Create `src/tools/manage-variants.ts` — schema: `{ product_id, action: "create"|"update"|"delete", variant?, variant_id? }`, metadata name `manage-variants`; handler dispatches to `VariantService`
- [ ] 4.11 RED: Write `src/tools/manage-variants.test.ts` — test create/update/delete paths
- [ ] 4.12 GREEN: Implement until test passes
- [ ] 4.13 Create `src/tools/manage-images.ts` — schema: `{ product_id, action: "add"|"remove"|"reorder", image_url?, image_id?, position? }`, metadata name `manage-images`; handler dispatches to `ImageService`
- [ ] 4.14 RED: Write `src/tools/manage-images.test.ts` — test add/remove/reorder paths
- [ ] 4.15 GREEN: Implement until test passes
- [ ] 4.16 Create `src/tools/update-stock.ts` — schema: `{ variant_stock: [{ variant_id, stock }] }` with stock ≥ 0 validation, metadata name `update-stock`; handler calls `StockService.updateStock()`
- [ ] 4.17 RED: Write `src/tools/update-stock.test.ts` — test negative stock rejected at schema level
- [ ] 4.18 GREEN: Implement until test passes
- [ ] 4.19 Create `src/tools/delete-product.ts` — schema: `{ product_id, confirm: z.boolean() }`, metadata name `delete-product`, annotations: `destructiveHint: true`; handler requires `confirm: true` else returns error
- [ ] 4.20 RED: Write `src/tools/delete-product.test.ts` — test confirm required, confirm=true deletes
- [ ] 4.21 GREEN: Implement until test passes

## Phase 5: Integration — Wire Everything Together

- [ ] 5.1 Update `src/tools/index.ts` or `xmcp.config.ts` to export all 7 product tools (check existing pattern from `greet.ts`)
- [ ] 5.2 Run `bun test` — verify all 21 test files pass
- [ ] 5.3 Run `bun run build` — verify `dist/http.js` compiles without errors
- [ ] 5.4 Run `bun x ultracite check` — zero linter errors
- [ ] 5.5 Run `bun test --coverage` — verify ≥80% coverage on new code

## Implementation Order

1. **PR 1 (Foundation)**: domain types → config → tiendanube adapter → product adapter (minimum viable end-to-end: list a product)
2. **PR 2 (Adapters)**: variant + image adapters (each resource isolated)
3. **PR 3 (Services + Tools)**: all 4 services → all 7 tools + tests → integration verification

**Dependency chain**: PR 1 must merge before PR 2; PR 2 must merge before PR 3.
