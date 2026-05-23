# Exploration: mcp-tiendanube MCP Server — Technical Roadmap & PRD

## Context

**Change**: `mcp-tiendanube-roadmap-prd`
**Artifact store**: `openspec`
**Project**: `mcp-tiendanube`
**Date**: 2026-05-22

---

## Current State

The project is a **greenfield xmcp v0.6.10 server** scaffolded from `create-xmcp-app`. It has:

- **No Tiendanube integration** — no API client, no auth, no product/orders/customer domain models
- **No real tools** — only a `greet` placeholder and `review-code` prompt template
- **Minimal infrastructure** — Bun runtime, TypeScript strict, Zod v4, Ultracite (oxlint + oxfmt), bun test
- **OpenSpec structure** exists under `openspec/` but all phase subdirectories (`01-context`, `02-requirements`, etc.) are **empty** — no prior specs or design decisions

### Project Structure (as-is)

```
mcp-tiendanube/
├── src/
│   ├── tools/          ← greet.ts (placeholder only)
│   ├── prompts/        ← review-code.ts (placeholder only)
│   └── resources/      ← (config)/app.ts, (users)/[userId]/index.ts (placeholders)
├── xmcp.config.ts      ← HTTP transport, paths configured
├── package.json        ← xmcp 0.6.10, zod ^4.0.0, bun:test
├── tsconfig.json       ← strict mode, bundler module resolution
├── oxlint.config.ts    ← Ultracite linter config (empty/warnings only)
├── oxfmt.config.ts    ← Ultracite formatter config (empty)
└── openspec/           ← directory structure exists but empty
```

### What xmcp Provides

- **Tool pattern**: `schema` (Zod) + `metadata` (ToolMetadata) + default function
- **Prompt pattern**: same, with `PromptMetadata` (includes `role: "user"`)
- **Resource pattern**: `metadata` + default handler, URI via folder structure
- **Transports**: HTTP (default) and STDIO via `xmcp build`
- **Build output**: `dist/http.js` or `dist/stdio.js`

### Tiendanube API Reality (from devhub-docs)

1. **API Base URLs**: `https://api.tiendanube.com/v1/{store_id}` or `https://api.nuvemshop.com.br/v1/{store_id}`
2. **Authentication**: OAuth 2.0 "Authorization Code" flow — non-expiring `access_token` + `user_id` (store ID)
3. **Scopes**: e.g., `write_products`, `read_products` — must be requested at app creation
4. **Rate limits**: Not documented in the public docs I could fetch, but likely applies
5. **User-Agent header required**: `MyApp (name@email.com)` format
6. **Error handling**: HTTP status codes, no formal error body schema visible in quick docs

---

## Affected Areas

| File/Directory         | Why Affected                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/tools/`           | Will need product tools (list, get, update, create variants, images, stock, delete)                                  |
| `src/services/`        | **New** — Tiendanube API client, auth, pagination, retry logic                                                       |
| `src/adapters/`        | **New** — Zod schemas for API request/response transformation                                                        |
| `src/domain/`          | **New** — Product, Variant, Image, Order, Customer, Category domain models                                           |
| `src/middleware/`      | **New** — Error handling, logging, observability                                                                     |
| `xmcp.config.ts`       | May need adaptation for multi-transport or config injection                                                          |
| `openspec/config.yaml` | Already has project context; may need domain-specific rules                                                          |
| `.env.example`         | **New** — `TIENDANUBE_CLIENT_ID`, `TIENDANUBE_CLIENT_SECRET`, `TIENDANUBE_ACCESS_TOKEN` (MVP), `TIENDANUBE_STORE_ID` |

---

## Approaches

### Approach A: "Thin API Wrapper" — Minimal Viable MCP

**Description**: One tool per Tiendanube API operation (e.g., `list-products`, `get-product`, `update-product`, `create-product-variant`, etc.). Direct 1:1 mapping.

| Pros                               | Cons                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| Fast to implement                  | LLM sees 15+ tools — high selection burden                  |
| Familiar to REST API developers    | Tool names reveal implementation (HTTP verbs, entity names) |
| Easy to generate from OpenAPI spec | Doesn't follow MCP design best practices                    |
| Straightforward error mapping      | Every tool needs similar boilerplate                        |

**Effort**: Low | **Risk**: High (poor LLM ergonomics)

---

### Approach B: "Task-Oriented Tools" — Best Practice MCP (Recommended)

**Description**: Shape tools around user tasks, not API endpoints. Group related operations into cohesive tools with rich parameters.

Suggested initial tool set (MVP):

| Tool              | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `list-products`   | Paginated list with filters (stock status, search query, page) |
| `get-product`     | Full product detail with variants and images                   |
| `update-products` | Bulk update products (price, name, description, etc.)          |
| `manage-variants` | Create/update/delete variants within a product                 |
| `manage-images`   | Add/remove/reorder product images                              |
| `update-stock`    | Simple stock level updates across variants                     |
| `delete-product`  | Delete a product (with confirmation hint)                      |

| Pros                                                         | Cons                                          |
| ------------------------------------------------------------ | --------------------------------------------- |
| Follows MCP design principles from `mcp-server-design` skill | Requires more upfront design thinking         |
| Fewer, more purposeful tools                                 | Bulk operations are more complex to implement |
| LLMs can reason about tasks, not API calls                   | Error handling needs to be more sophisticated |
| Reduces cognitive load on LLM                                |                                               |

**Effort**: Medium | **Risk**: Low (proven pattern)

---

### Approach C: "Domain-Expert Agent" — Full Progressive Scaling

**Description**: Beyond tools, add prompts that act as domain experts (e.g., "You are an e-commerce inventory specialist..."). Resources for store configuration. Long-term multi-tenant architecture baked in from day 1.

| Pros                                | Cons                                       |
| ----------------------------------- | ------------------------------------------ |
| Most powerful for complex use cases | Over-engineered for MVP scope              |
| Future-proof for multi-store        | Significant upfront investment             |
| Richest LLM experience              | Requires more sophisticated error handling |

**Effort**: High | **Risk**: Medium (scope creep)

---

## Recommendation

**Approach B — Task-Oriented Tools** for the MVP phase.

Rationale:

- This project follows the `mcp-server-design` skill's philosophy (I loaded it as a relevant skill)
- The Tiendanube API has ~8 product-related operations — this maps cleanly to 6-8 task-oriented tools
- MVP scope is explicitly product operations — no need to over-engineer for orders/customers/webhooks yet
- Architecture can be prepared for future scaling without building it now (clean layers: tools → services → adapters → API)

### Architecture Layers (proposed)

```
src/
├── tools/           ← Task-oriented MCP tools (list-products.ts, get-product.ts, etc.)
├── services/         ← Business logic (ProductService, VariantService, etc.)
├── adapters/        ← Tiendanube API client (HTTP, auth, retry, pagination)
├── domain/          ← TypeScript types, Zod schemas for domain models
├── middleware/      ← Centralized error handling, logging
└── config/          ← Environment variables, typed config
```

---

## Risks

1. **OAuth token management**: No auth flow implemented yet. For MVP, a single `TIENDANUBE_ACCESS_TOKEN` env var is acceptable, but multi-tenant (future) needs proper OAuth token rotation.
2. **Rate limiting**: Tiendanube API may have rate limits — no backoff/retry logic in MVP design yet.
3. **API versioning**: Docs show `v1` — if API changes, adapters need versioning strategy.
4. **No existing tests**: Only `greet.test.ts` exists as a placeholder. Full TDD with bun:test needs to be established.
5. **Scope creep**: "Future scalability: orders, customers, categories, webhooks" is tempting — must resist until MVP is verified.
6. **LGPD compliance**: Brazil's data protection law requires webhook setup for certain app types — not relevant for this MCP server but worth noting if store data handling expands.

---

## Open Questions (Clarify Before Design)

1. **Authentication flow**: Is a single static `access_token` per deployment acceptable for MVP, or does each user need their own store connection?
2. **Multi-store support**: Should one MCP server instance serve one store, or should it handle multiple stores (with different tokens)?
3. **Error response format**: Should errors be user-friendly messages or raw API error details?
4. **Pagination**: How should large result sets be handled? (All pages, cursor-based, limit/offset?)
5. **Build target**: HTTP transport is configured — is STDIO also needed for local AI tool integration?
6. **Observability**: Any external logging/tracing system to integrate? (Sentry, Datadog, etc.)

---

## Ready for Proposal

**Yes — with the following artifacts to produce in sdd-propose**:

1. **PRD sections**:
   - Problem Statement & Goals
   - MVP Feature Set (6-8 tools)
   - User Stories & Acceptance Criteria
   - Non-Goals (what MVP explicitly won't do)
   - Success Metrics

2. **Technical roadmap phases**:
   - Phase 1: Foundation (API client, auth, config, domain models)
   - Phase 2: MVP Tools (6-8 product tools)
   - Phase 3: Error handling, validation, testing
   - Phase 4+: Orders, Customers, Categories (future)

3. **Architecture decision**: Layered approach (tools → services → adapters → API)

**Next recommended phase**: `sdd-propose` — define scope, approach, and roadmap phases.
