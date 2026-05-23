# Product CRUD — MCP Server Spec

## ADDED Requirements

### Requirement: list-products — Paginated product listing with filters

The system SHALL return a paginated list of products from Tiendanube. The tool MUST support filtering by `stock_status` (in_stock, out_of_stock, all), `search` query (matched against product name), and `page` number. Each page MUST return up to 50 products. The response MUST include `products[]`, `pagination.total`, `pagination.page`, `pagination.per_page`, `pagination.total_pages`.

The adapter MUST call `GET /v1/{store_id}/products` with query params `page`, `per_page`, `fields`, and `search` if provided. The service MUST transform Tiendanube's nested product response into a flat structure.

#### Scenario: List first page of all products

- GIVEN a valid `TIENDANUBE_ACCESS_TOKEN` and `TIENDANUBE_STORE_ID`
- WHEN the LLM calls `list-products` with no filters
- THEN the tool returns page 1 with up to 50 products and correct pagination metadata
- AND each product includes `id`, `name`, `description`, `price`, `stock`, `variants_count`

#### Scenario: Filter by out-of-stock products

- GIVEN products exist with zero stock in Tiendanube
- WHEN `list-products` is called with `stock_status: "out_of_stock"`
- THEN only products with `stock = 0` are returned
- AND products with stock > 0 are excluded

#### Scenario: Empty result set

- GIVEN no products match the search query
- WHEN `list-products` is called with `search: "nonexistent"`
- THEN returns an empty `products[]` array with `total: 0`

---

### Requirement: get-product — Full product detail with variants and images

The system SHALL return complete product details including all variants and images. The tool MUST accept a product `id` (numeric Tiendanube ID). The response MUST include the full product object with nested `variants[]` and `images[]`.

The adapter MUST call `GET /v1/{store_id}/products/{id}?fields=**` to fetch the full resource tree.

#### Scenario: Get product with variants and images

- GIVEN a product `123` exists in Tiendanube with 3 variants and 2 images
- WHEN the LLM calls `get-product` with `id: 123`
- THEN the response includes `product.variants` (length 3) and `product.images` (length 2)
- AND variant fields include `id`, `sku`, `price`, `stock`
- AND image fields include `id`, `src`, `position`

#### Scenario: Product not found

- GIVEN product `99999` does not exist in Tiendanube
- WHEN `get-product` is called with `id: 99999`
- THEN the tool returns a user-friendly error: "Product not found (ID: 99999)"
- AND NOT a raw HTTP 404

---

### Requirement: update-products — Bulk product attribute updates

The system SHALL update product attributes in bulk. The tool MUST accept an array of `{ id, updates }` where `updates` is a partial product (price, name, description, attributes). Each update MUST be validated against the Zod input schema before any API call. The tool MUST return results for each product indicating success or failure.

The adapter MUST call `PUT /v1/{store_id}/products/{id}` for each product. Updates with no valid fields to change SHALL be skipped gracefully.

#### Scenario: Bulk update price and name

- GIVEN product `100` has price `10.00` and product `200` has price `20.00`
- WHEN `update-products` is called with `[{ id: 100, updates: { price: "15.00" } }, { id: 200, updates: { name: "New Name" } }]`
- THEN both products are updated in Tiendanube
- AND response includes per-item success/failure with the updated values

#### Scenario: Partial validation failure

- GIVEN the update array contains one invalid ID
- WHEN `update-products` is called with valid and invalid items mixed
- THEN valid items are processed successfully
- AND invalid items return errors without blocking valid ones

#### Scenario: Invalid price format

- GIVEN an update contains `price: "not-a-number"`
- WHEN Zod validation runs
- THEN the tool returns a validation error before making any API call
- AND no products are modified

---

### Requirement: manage-variants — Create, update, and delete variants

The system SHALL allow create, update, and delete operations on variants within a product. The tool MUST accept `product_id`, `action` (create | update | delete), and `variant` (for create/update) or `variant_id` (for delete). The response MUST reflect the resulting variant state.

The adapter MUST call `POST /v1/{store_id}/products/{product_id}/variants`, `PUT /v1/{store_id}/variants/{id}`, or `DELETE /v1/{store_id}/variants/{id}` as appropriate.

#### Scenario: Create a new variant

- GIVEN product `100` exists
- WHEN `manage-variants` is called with `product_id: 100`, `action: "create"`, and `variant: { sku: "Shoe-42", price: "59.99", stock: 10 }`
- THEN a new variant is created under product 100
- AND response includes the created variant with its Tiendanube-assigned ID

#### Scenario: Delete a variant

- GIVEN product `100` has a variant with `id: 500`
- WHEN `manage-variants` is called with `product_id: 100`, `action: "delete"`, `variant_id: 500`
- THEN variant 500 is deleted from Tiendanube
- AND response confirms deletion

---

### Requirement: manage-images — Add, remove, and reorder product images

The system SHALL manage product images. The tool MUST accept `product_id`, `action` (add | remove | reorder), `image_url` (for add), `image_id` (for remove/reorder), and `position` (for reorder). Adding an image MUST accept a URL and upload it to Tiendanube.

The adapter MUST call `POST /v1/{store_id}/products/{id}/images`, `DELETE /v1/{store_id}/images/{id}`, or `PUT /v1/{store_id}/images/{id}` for reorder.

#### Scenario: Add image from URL

- GIVEN product `100` exists
- WHEN `manage-images` is called with `product_id: 100`, `action: "add"`, `image_url: "https://example.com/img.jpg"`
- THEN the image is uploaded to Tiendanube and attached to product 100
- AND response includes the new image's `id` and `src`

#### Scenario: Remove image

- GIVEN product `100` has an image with `id: 300`
- WHEN `manage-images` is called with `product_id: 100`, `action: "remove"`, `image_id: 300`
- THEN image 300 is deleted from Tiendanube
- AND response confirms removal

---

### Requirement: update-stock — Stock level updates across variants

The system SHALL update stock levels for one or more variants in a single call. The tool MUST accept `variant_stock[]` where each item has `variant_id` and `stock` (integer). The adapter MUST call `PUT /v1/{store_id}/variants/{id}` with `stock` field only.

#### Scenario: Update stock for multiple variants

- GIVEN variant `10` has stock 5 and variant `20` has stock 8
- WHEN `update-stock` is called with `[{ variant_id: 10, stock: 20 }, { variant_id: 20, stock: 0 }]`
- THEN variant 10 stock becomes 20 and variant 20 stock becomes 0
- AND response includes per-variant updated stock values

#### Scenario: Negative stock rejected

- GIVEN Zod schema validates `stock >= 0`
- WHEN `update-stock` is called with any negative stock value
- THEN validation error is returned before any API call

---

### Requirement: delete-product — Delete a product with confirmation hint

The system SHALL delete a product from Tiendanube. The tool MUST accept `product_id` and `confirm: true` (bool) to prevent accidental deletions. Without `confirm: true`, the tool SHALL return an error instructing the LLM to confirm.

The adapter MUST call `DELETE /v1/{store_id}/products/{id}`.

#### Scenario: Delete with confirmation

- GIVEN product `100` exists
- WHEN `delete-product` is called with `product_id: 100, confirm: true`
- THEN product 100 is permanently deleted from Tiendanube
- AND response confirms deletion

#### Scenario: Delete without confirmation

- GIVEN product `100` exists
- WHEN `delete-product` is called with `product_id: 100` (no `confirm`)
- THEN the tool returns error: "Deletion requires confirm: true"
- AND product 100 remains intact

---

## Non-Functional Requirements

### Requirement: Rate limiting handling

The system SHOULD implement exponential backoff with jitter when Tiendanube returns HTTP 429. The adapter layer MUST detect 429 responses and retry up to 3 times with delays of 1s, 2s, 4s before failing.

### Requirement: Error handling strategy

The system MUST map Tiendanube API errors (4xx, 5xx) to user-friendly messages. HTTP 401 SHALL return "Invalid or expired access token — check TIENDANUBE_ACCESS_TOKEN". HTTP 404 SHALL return "Resource not found". HTTP 5xx SHALL return "Tiendanube API temporarily unavailable". Raw HTTP statuses MUST NOT be exposed to the LLM.

### Requirement: Response normalization

All Tiendanube responses MUST be normalized in the adapter layer. The service layer MUST receive clean domain objects (Product, Variant, Image) — never raw API response shapes.

### Requirement: Logging and observability

All tool calls MUST log input params (excluding tokens) and response status at INFO level. All API errors MUST log at ERROR level with the full error response body. Logs MUST NOT include `TIENDANUBE_ACCESS_TOKEN` values.

## Architecture Requirements

### Requirement: Layer separation

The system MUST enforce strict layer boundaries: `tools/` calls `services/`, services call `adapters/`, adapters call the Tiendanube HTTP API. No layer MAY import from a layer above it. The `domain/` layer (types + Zod schemas) has no dependencies and is imported by all layers.

### Requirement: Type safety requirements

All function parameters and return values across all layers MUST have explicit TypeScript types. The `domain/` layer exports both Zod schemas and inferred `z.infer<>` types. No `any` types allowed in any layer.

### Requirement: Test coverage requirements

Every service method and adapter method MUST have at least one bun test covering the public interface. Tests MUST NOT mock internal collaborators — only external HTTP calls. Coverage MUST be ≥80% for new code per the project's CI gate.
