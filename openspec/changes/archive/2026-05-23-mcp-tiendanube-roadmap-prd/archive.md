# Archive Report: mcp-tiendanube-roadmap-prd

## Change Metadata

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| **Change Name**    | mcp-tiendanube-roadmap-prd                                        |
| **Archived Date**  | 2026-05-23                                                        |
| **Archived To**    | `openspec/changes/archive/2026-05-23-mcp-tiendanube-roadmap-prd/` |
| **Artifact Store** | openspec                                                          |
| **Status**         | COMPLETE                                                          |

## Executive Summary

Built an MVP MCP server giving LLMs full product lifecycle management for Tiendanube stores. Implemented 7 task-oriented tools (`list-products`, `get-product`, `update-products`, `manage-variants`, `manage-images`, `update-stock`, `delete-product`) with a strict 4-layer architecture (tools → services → adapters → API). All 76 tests pass at 91% line coverage, verified compliant across all 7 tools.

## Specs Synced

| Domain       | Action  | Details                                                                                         |
| ------------ | ------- | ----------------------------------------------------------------------------------------------- |
| product-crud | Created | Main spec created at `openspec/specs/product-crud/spec.md` — 7 requirements, 4 NFRs, 3 ArchReqs |

Delta spec merged into new main spec (no prior spec existed). All 7 requirements + NFRs + Architecture Requirements now live in `openspec/specs/product-crud/spec.md`.

## Archive Contents

| Artifact                     | Status                    |
| ---------------------------- | ------------------------- |
| `proposal.md`                | ✅                        |
| `exploration.md`             | ✅                        |
| `specs/product-crud/spec.md` | ✅                        |
| `design.md`                  | ✅                        |
| `tasks.md`                   | ✅ (28/28 tasks complete) |
| `apply-progress.md`          | ✅                        |
| `verify-report.md`           | ✅                        |

## Verification Results

| Metric          | Value  | Threshold |
| --------------- | ------ | --------- |
| Tests passing   | 76/76  | 100% ✅   |
| Line coverage   | 91.02% | ≥80% ✅   |
| Tools compliant | 7/7    | 100% ✅   |

**Verdict**: PASS — ready for archive.

## Source of Truth Updated

- `openspec/specs/product-crud/spec.md` — now contains the canonical spec for product-crud MCP server

## Lessons Learned

1. **xmcp build includes test files in type-checking**: The xmcp bundler type-checks test files too, causing TS errors on branded types. These are build-time only and don't affect runtime — `.xmcp/http.js` generates correctly. Workaround: accept TS errors in test files or use interface-based mocking.

2. **Zod v4 API differences from v3**: `coerce.number().int().min(1).default(1)` in Zod v4 requires an argument even for defaults — tests needed adjustment.

3. **Bun's mock capabilities are limited**: Adapter tests were simplified to test the interface rather than mock `Bun.fetch` directly. Plan for this when estimating TDD phase effort.

4. **Setter injection over constructor injection**: Tools used setter injection for service dependencies to simplify testing — a reasonable deviation from pure DI.

5. **Delivery strategy matters**: High-risk changes (>400 lines) should use chained PRs. This change was high-risk but used single-PR with exception — worked but required careful coordination.

## Next Changes Suggested

1. **Rate limiting backoff** (Phase 3 per proposal) — implement exponential backoff for 429 responses in the Tiendanube adapter
2. **Orders/Customers/Categories** (Phase 4+ per proposal) — extend MCP server beyond products once MVP is validated
3. **STDIO transport** — add STDIO transport for local AI tool integration (out of scope for MVP)

## SDD Cycle Complete

This change has been fully planned (proposal), explored (exploration), specified (specs), designed (design), implemented (tasks + apply), verified (verify-report), and archived (here).

**Ready for the next change.**
