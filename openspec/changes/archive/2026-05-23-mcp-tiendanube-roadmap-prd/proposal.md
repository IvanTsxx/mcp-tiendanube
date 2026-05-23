# Proposal: mcp-tiendanube Roadmap — Product CRUD MCP Server

## Intent

Build an MVP MCP server that gives LLMs the ability to manage Tiendanube product catalogs via task-oriented tools. The server bridges xmcp (MCP protocol) with Tiendanube's REST API using static env credentials (OAuth token). Goal: LLM can list, inspect, edit, and manage product variants, images, and stock without understanding REST API mechanics.

## Scope

### In Scope

- **7 task-oriented tools** covering full product lifecycle:
  - `list-products` — paginated list with filters (stock status, search, page)
  - `get-product` — full product detail with variants and images
  - `update-products` — bulk update (price, name, description, attributes)
  - `manage-variants` — create/update/delete variants within a product
  - `manage-images` — add/remove/reorder product images
  - `update-stock` — stock level updates across variants
  - `delete-product` — delete with confirmation hint
- **Layered architecture**: tools → services → adapters → Tiendanube API
- **TDD enforcement**: every service and adapter has bun tests (strict TDD)
- **Config from .env**: `TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID`, `TIENDANUBE_API_BASE_URL`

### Out of Scope

- Auth flow / OAuth implementation (static token only for MVP)
- Orders, customers, categories, or webhook domains
- Multi-store / multi-tenant support
- Rate limit backoff (Phase 3+)
- STDIO transport (HTTP only for MVP)

## Capabilities

### New Capabilities

- `product-crud`: Full product lifecycle management via Tiendanube API — list, get, update, delete products; manage variants, images, and stock levels. Exposes 7 task-oriented tools.

### Modified Capabilities

- None (greenfield implementation)

## Approach

**Task-oriented tools with layered architecture** (Approach B from exploration):

```
src/
├── tools/          ← MCP tools (list-products.ts, get-product.ts, etc.)
├── services/        ← Business logic (ProductService, VariantService)
├── adapters/        ← Tiendanube HTTP client (auth headers, retry, pagination)
├── domain/          ← TypeScript types + Zod schemas (Product, Variant, Image)
├── middleware/      ← Centralized error handling, error mapping
└── config/          ← Typed env config (TiedenubeConfig)
```

**Tool design principles** (per `mcp-server-design` skill):

- Named for purpose, not implementation (`update-products`, not `PUT /products`)
- Rich descriptions guiding LLM behavior
- Bulk operations where they reduce round-trips
- Zod v4 schemas for all inputs with custom error messages

**TDD workflow** (per `tdd` skill):

- Tracer bullets: one behavior → one test → minimal impl → repeat
- Integration-style tests via service public interfaces
- No mocking internal collaborators

## Affected Areas

| Area              | Impact   | Description                                                |
| ----------------- | -------- | ---------------------------------------------------------- |
| `src/tools/`      | New      | 7 MCP tool files                                           |
| `src/services/`   | New      | ProductService, VariantService, ImageService, StockService |
| `src/adapters/`   | New      | TiendanubeApiClient with HTTP, auth, pagination            |
| `src/domain/`     | New      | Product, Variant, Image types + Zod schemas                |
| `src/middleware/` | New      | Error mapping, API error → user-friendly error             |
| `src/config/`     | New      | Typed environment config                                   |
| `xmcp.config.ts`  | Modified | Likely unchanged, confirmed compatible                     |
| `.env.example`    | New      | Token, store ID, API base URL                              |

## Risks

| Risk                                | Likelihood | Mitigation                                                              |
| ----------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Tiendanube API changes (v1 drift)   | Medium     | Version adapter layer; isolate API calls in `adapters/`                 |
| Rate limit hits cause tool failures | Medium     | Add exponential backoff in Phase 3; document limit in tool descriptions |
| LLM produces invalid bulk updates   | Low        | Zod schema validation with clear error messages per field               |
| .env token expires / rotates        | Low        | Document token refresh process; log clear error on 401                  |
| Scope creep (orders, customers)     | High       | Hard boundary — MVP is products only; Phase 4+ is separate change       |

## Rollback Plan

1. **Revert code**: `git checkout HEAD~1` on the feature branch removes all product tools
2. **Remove artifacts**: Delete `src/tools/products/`, `src/services/`, `src/adapters/tiendanube.ts`, `src/domain/`
3. **Preserve config**: Keep `.env.example` as reference
4. **Preserve tests**: Tests live alongside impl — revert removes them together
5. **No data migration needed**: MCP server is stateless; no Tiendanube data is stored

## Dependencies

- xmcp 0.6.10 (already in package.json)
- Bun runtime (already configured)
- Tiendanube API v1 (external, no control)
- Zod v4 (already in package.json)

## Success Criteria

- [ ] `bun test` passes with ≥80% coverage on new code
- [ ] All 7 tools respond correctly to valid input (verified via test)
- [ ] All tools return user-friendly error messages on API failure (not raw HTTP status)
- [ ] `bun run build` produces `dist/http.js` without errors
- [ ] `ultracite check` reports zero errors
- [ ] Tools work end-to-end with existing .env credentials (manual verification)
- [ ] No auth logic in codebase — token comes from env only
