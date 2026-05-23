> **Nota crítica de alcance**: El repositorio `TiendaNube/devhub-apps` es un **portal de documentación Docusaurus** — no contiene la implementación de la API ni una especificación OpenAPI. Los endpoints están documentados en guías narrativas (ERP Guide, Developer Tools), con ejemplos cURL parciales. La referencia canónica completa vive en `https://tiendanube.github.io/api-documentation/`. Todo lo que sigue está extraído exhaustivamente de los archivos del repo; donde los detalles son inferidos desde contexto cercano, se indica explícitamente.

---

## Fundamentos globales

### Base URLs [1](#0-0)

```
https://api.tiendanube.com/v1/{store_id}
https://api.nuvemshop.com.br/v1/{store_id}
```

### Headers obligatorios en TODOS los requests [2](#0-1)

| Header           | Requerido     | Descripción           | Ejemplo                  |
| ---------------- | ------------- | --------------------- | ------------------------ |
| `Authentication` | Sí            | Bearer token OAuth2   | `bearer ACCESS_TOKEN`    |
| `User-Agent`     | Sí            | Nombre de app + email | `MyApp (name@email.com)` |
| `Content-Type`   | Solo POST/PUT | Tipo de contenido     | `application/json`       |

### Rate Limits (Leaky Bucket) [3](#0-2)

| Plan             | Capacidad bucket | Leak rate  |
| ---------------- | ---------------- | ---------- |
| Standard         | 40 requests      | 2 req/seg  |
| Next / Evolution | 400 requests     | 20 req/seg |

**Response headers de rate limit:**

- `x-rate-limit-limit` — capacidad total del bucket
- `x-rate-limit-remaining` — slots restantes
- `x-rate-limit-reset` — ms hasta que el bucket se vacíe

### Paginación [4](#0-3)

- **No habilitada por defecto** — debe activarse con query params
- `page` — número de página (empieza en 1)
- `per_page` — máximo 200
- Response header `x-total-count` — total de items
- Response header `Link` — URLs `rel="next"` y `rel="prev"`

---

## Endpoint 0 — OAuth Token Exchange

````json
{
  "method": "POST",
  "path": "https://www.tiendanube.com/apps/authorize/token",
  "summary": "Exchange authorization code for access token",
  "description": "Intercambia el authorization code temporal (válido 5 minutos) por un access_token permanente. El token no expira hasta que el merchant desinstala la app o se genera uno nuevo.",
  "authentication": {
    "type": "none",
    "note": "Este endpoint no requiere token previo — es el que genera el token"
  },
  "headers": [],
  "queryParams": [],
  "pathParams": [],
  "bodyParams": [
    { "name": "client_id", "type": "string", "required": true, "description": "App ID del Partner Portal" },
    { "name": "client_secret", "type": "string", "required": true, "description": "Client secret del Partner Portal" },
    { "name": "grant_type", "type": "string", "required": true, "description": "Debe ser 'authorization_code'" },
    { "name": "code", "type": "string", "required": true, "description": "Código recibido en el redirect URI tras la instalación" }
  ],
  "requestExample": {
    "curl": "curl -X POST 'https://www.tiendanube.com/apps/authorize/token' -d 'client_id=CLIENT_ID' -d 'client_secret=CLIENT_SECRET' -d 'grant_type=authorization_code' -d 'code=AUTH_CODE'"
  },
  "responseExample": {
    "access_token": "88a2fdd17e10327ed96f4f2dc96b00bca60dfe60",
    "token_type": "bearer",
    "scope": "write_products",
    "user_id": 2093261
  },
  "responseFields": [
    { "name": "access_token", "type": "string", "description": "Token permanente para autenticar requests a la API" },
    { "name": "token_type", "type": "string", "description": "Siempre 'bearer'" },
    { "name": "scope", "type": "string", "description": "Scopes concedidos por el merchant" },
    { "name": "user_id", "type": "integer", "description": "ID de la tienda (store_id) — usar en todas las URLs de la API" }
  ],
  "statusCodes": [
    { "code": 200, "description": "Token generado exitosamente" },
    { "code": 400, "description": "Código inválido o expirado (el code dura solo 5 minutos)" },
    { "code": 401, "description": "client_id o client_secret incorrectos" }
  ],
  "rateLimits": "N/A",
  "scopes": "N/A",
  "notes": "El code expira en 5 minutos. Para obtener uno nuevo, desinstalar y reinstalar la app en la tienda demo.",
  "resource": "authentication"
}
``` [5](#0-4)

---

## RESOURCE: Products

### Endpoint 1 — List Products

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/products",
  "summary": "List all products",
  "description": "Retorna la lista paginada de productos de la tienda. Soporta filtros por múltiples parámetros.",
  "authentication": {
    "type": "oauth2",
    "headers": ["Authentication", "User-Agent"]
  },
  "headers": [
    { "name": "Authentication", "required": true, "example": "bearer ACCESS_TOKEN" },
    { "name": "User-Agent", "required": true, "example": "MyApp (name@email.com)" }
  ],
  "queryParams": [
    { "name": "page", "type": "integer", "required": false, "description": "Número de página (default: 1)" },
    { "name": "per_page", "type": "integer", "required": false, "description": "Items por página (max: 200)" },
    { "name": "since_id", "type": "integer", "required": false, "description": "Retorna productos con ID mayor al especificado — INFERIDO desde convención REST de la plataforma" },
    { "name": "language", "type": "string", "required": false, "description": "Código ISO de idioma para campos multilingüe — INFERIDO" },
    { "name": "q", "type": "string", "required": false, "description": "Búsqueda por texto — INFERIDO" },
    { "name": "handle", "type": "string", "required": false, "description": "Filtrar por slug URL — INFERIDO" },
    { "name": "category_id", "type": "integer", "required": false, "description": "Filtrar por categoría — INFERIDO" }
  ],
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true, "description": "ID de la tienda (user_id del token OAuth)" }
  ],
  "bodyParams": [],
  "requestExample": {
    "curl": "curl -H 'Authentication: bearer ACCESS_TOKEN' -H 'User-Agent: MyApp (name@email.com)' https://api.tiendanube.com/v1/123456/products"
  },
  "responseExample": {
    "note": "Array de objetos producto — schema completo en tiendanube.github.io/api-documentation/resources/product"
  },
  "statusCodes": [
    { "code": 200, "description": "Lista de productos" },
    { "code": 401, "description": "Token inválido o ausente" },
    { "code": 429, "description": "Rate limit excedido" }
  ],
  "rateLimits": "Leaky Bucket: 40 req / 2 per sec (standard)",
  "scopes": ["read_products"],
  "notes": "Paginación no activa por defecto. Usar page + per_page. Header x-total-count indica total.",
  "resource": "products"
}
``` [6](#0-5)

---

### Endpoint 2 — Create Product

```json
{
  "method": "POST",
  "path": "/v1/{store_id}/products",
  "summary": "Create a product",
  "description": "Crea un nuevo producto en la tienda. Para productos sin variación, el SKU, precio y stock se gestionan directamente en el producto. Para productos con variación, se definen attributes y values.",
  "authentication": {
    "type": "oauth2",
    "headers": ["Authentication", "User-Agent", "Content-Type"]
  },
  "headers": [
    { "name": "Authentication", "required": true, "example": "bearer ACCESS_TOKEN" },
    { "name": "User-Agent", "required": true, "example": "MyApp (name@email.com)" },
    { "name": "Content-Type", "required": true, "example": "application/json" }
  ],
  "queryParams": [],
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true, "description": "ID de la tienda" }
  ],
  "bodyParams": [
    { "name": "name", "type": "string | object", "required": true, "description": "Nombre del producto. String simple o objeto multilingüe: {\"pt\": \"Nome\", \"en\": \"Name\"}" },
    { "name": "description", "type": "string | object", "required": false, "description": "Descripción. Acepta HTML. Multilingüe igual que name." },
    { "name": "handle", "type": "string | object", "required": false, "description": "Slug URL. Generado automáticamente si no se provee." },
    { "name": "categories", "type": "array", "required": false, "description": "Array de IDs de categorías" },
    { "name": "price", "type": "string", "required": false, "description": "Precio (para productos sin variación)" },
    { "name": "stock", "type": "integer", "required": false, "description": "Stock (para productos sin variación)" },
    { "name": "sku", "type": "string", "required": false, "description": "SKU (para productos sin variación)" },
    { "name": "attributes", "type": "array", "required": false, "description": "Atributos de variación. Ej: [{\"en\": \"Size\"}]" },
    { "name": "variants", "type": "array", "required": false, "description": "Array de variantes con values, price, stock, sku" },
    { "name": "images", "type": "array", "required": false, "description": "Array de objetos imagen con src (URL)" },
    { "name": "inventory_levels", "type": "array", "required": false, "description": "Stock por location: [{\"location_id\": \"...\", \"stock\": N}]" }
  ],
  "requestExample": {
    "curl": "curl -H 'Authentication: bearer ACCESS_TOKEN' -H 'Content-Type: application/json' -H 'User-Agent: MyApp (name@email.com)' -d '{\"name\": \"Meu novo produto\"}' https://api.tiendanube.com/v1/123456/products",
    "body_simple": {
      "name": "Camiseta Básica",
      "price": "29.99",
      "stock": 100,
      "sku": "CAM-001"
    },
    "body_with_variants": {
      "name": { "pt": "Camiseta", "en": "T-Shirt", "es": "Camiseta" },
      "attributes": [{ "en": "Size" }],
      "variants": [
        { "values": [{ "en": "S" }], "price": "29.99", "stock": 50, "sku": "CAM-S" },
        { "values": [{ "en": "M" }], "price": "29.99", "stock": 50, "sku": "CAM-M" }
      ]
    }
  },
  "responseExample": {
    "note": "Objeto producto creado con id asignado por la plataforma — 201 Created"
  },
  "statusCodes": [
    { "code": 201, "description": "Producto creado exitosamente" },
    { "code": 400, "description": "Body inválido o campos requeridos ausentes" },
    { "code": 401, "description": "Token inválido" },
    { "code": 422, "description": "Error de validación" },
    { "code": 429, "description": "Rate limit excedido" }
  ],
  "rateLimits": "Leaky Bucket: 40 req / 2 per sec (standard)",
  "scopes": ["write_products"],
  "notes": "Para tiendas multilingüe, enviar name/description como objeto con códigos ISO. Para tiendas monolingüe, string simple es suficiente.",
  "resource": "products"
}
``` [7](#0-6) [8](#0-7)

---

### Endpoint 3 — Get Product

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/products/{product_id}",
  "summary": "Get a single product",
  "description": "Retorna los detalles completos de un producto específico incluyendo variantes e imágenes.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "headers": [
    { "name": "Authentication", "required": true, "example": "bearer ACCESS_TOKEN" },
    { "name": "User-Agent", "required": true, "example": "MyApp (name@email.com)" }
  ],
  "queryParams": [],
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true, "description": "ID interno del producto (10 dígitos)" }
  ],
  "bodyParams": [],
  "requestExample": {
    "curl": "curl -H 'Authentication: bearer ACCESS_TOKEN' -H 'User-Agent: MyApp (name@email.com)' https://api.tiendanube.com/v1/123456/products/789"
  },
  "statusCodes": [
    { "code": 200, "description": "Producto encontrado" },
    { "code": 404, "description": "Producto no encontrado" },
    { "code": 401, "description": "Token inválido" }
  ],
  "rateLimits": "Leaky Bucket: 40 req / 2 per sec",
  "scopes": ["read_products"],
  "resource": "products"
}
````

---

### Endpoint 4 — Update Product

```json
{
  "method": "PUT",
  "path": "/v1/{store_id}/products/{product_id}",
  "summary": "Update a product",
  "description": "Actualiza los datos de un producto existente. Soporta actualización parcial (solo los campos enviados se modifican).",
  "authentication": {
    "type": "oauth2",
    "headers": ["Authentication", "User-Agent", "Content-Type"]
  },
  "headers": [
    {
      "name": "Authentication",
      "required": true,
      "example": "bearer ACCESS_TOKEN"
    },
    {
      "name": "User-Agent",
      "required": true,
      "example": "MyApp (name@email.com)"
    },
    { "name": "Content-Type", "required": true, "example": "application/json" }
  ],
  "queryParams": [],
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "name", "type": "string | object", "required": false },
    { "name": "description", "type": "string | object", "required": false },
    { "name": "price", "type": "string", "required": false },
    { "name": "stock", "type": "integer", "required": false },
    { "name": "sku", "type": "string", "required": false },
    { "name": "categories", "type": "array", "required": false },
    {
      "name": "inventory_levels",
      "type": "array",
      "required": false,
      "description": "Stock por location — INFERIDO desde docs de products.md"
    }
  ],
  "statusCodes": [
    { "code": 200, "description": "Producto actualizado" },
    { "code": 404, "description": "Producto no encontrado" },
    { "code": 422, "description": "Error de validación" },
    { "code": 429, "description": "Rate limit excedido" }
  ],
  "rateLimits": "Leaky Bucket: 40 req / 2 per sec",
  "scopes": ["write_products"],
  "resource": "products"
}
```

---

### Endpoint 5 — Delete Product

```json
{
  "method": "DELETE",
  "path": "/v1/{store_id}/products/{product_id}",
  "summary": "Delete a product",
  "description": "Elimina permanentemente un producto y todas sus variantes e imágenes asociadas.",
  "authentication": {
    "type": "oauth2",
    "headers": ["Authentication", "User-Agent"]
  },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true }
  ],
  "statusCodes": [
    { "code": 200, "description": "Producto eliminado" },
    { "code": 404, "description": "Producto no encontrado" }
  ],
  "scopes": ["write_products"],
  "notes": "INFERIDO — DELETE es convención estándar REST de la plataforma, no documentado explícitamente en el repo.",
  "resource": "products"
}
```

---

## RESOURCE: Product Variants

### Endpoint 6 — List Variants

````json
{
  "method": "GET",
  "path": "/v1/{store_id}/products/{product_id}/variants",
  "summary": "List product variants",
  "description": "Retorna todas las variantes de un producto. Cada variante tiene su propio SKU, precio y stock.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true }
  ],
  "queryParams": [
    { "name": "page", "type": "integer", "required": false },
    { "name": "per_page", "type": "integer", "required": false, "description": "Max 200" }
  ],
  "statusCodes": [
    { "code": 200, "description": "Lista de variantes" },
    { "code": 404, "description": "Producto no encontrado" }
  ],
  "scopes": ["read_products"],
  "resource": "product_variants"
}
``` [9](#0-8)

---

### Endpoint 7 — Create Variant

```json
{
  "method": "POST",
  "path": "/v1/{store_id}/products/{product_id}/variants",
  "summary": "Create a product variant",
  "description": "Crea una nueva variante para un producto existente. Requiere que el producto tenga attributes definidos.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "values", "type": "array", "required": true, "description": "Valores de atributos. Ej: [{\"en\": \"XL\"}]" },
    { "name": "price", "type": "string", "required": true, "description": "Precio de la variante" },
    { "name": "stock", "type": "integer", "required": false, "description": "Stock inicial" },
    { "name": "sku", "type": "string", "required": false, "description": "SKU único de la variante" },
    { "name": "inventory_levels", "type": "array", "required": false, "description": "Stock por location: [{\"location_id\": \"...\", \"stock\": N}]" }
  ],
  "requestExample": {
    "body": {
      "values": [{ "en": "XL" }],
      "price": "39.99",
      "stock": 25,
      "sku": "CAM-XL-001"
    }
  },
  "statusCodes": [
    { "code": 201, "description": "Variante creada" },
    { "code": 422, "description": "Error de validación" }
  ],
  "scopes": ["write_products"],
  "notes": "El producto base debe tener attributes definidos antes de crear variantes.",
  "resource": "product_variants"
}
``` [10](#0-9)

---

### Endpoint 8 — Get Variant

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/products/{product_id}/variants/{variant_id}",
  "summary": "Get a single variant",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true },
    { "name": "variant_id", "type": "integer", "required": true }
  ],
  "scopes": ["read_products"],
  "statusCodes": [{ "code": 200, "description": "Variante encontrada" }, { "code": 404, "description": "No encontrada" }],
  "resource": "product_variants"
}
````

---

### Endpoint 9 — Update Variant

````json
{
  "method": "PUT",
  "path": "/v1/{store_id}/products/{product_id}/variants/{variant_id}",
  "summary": "Update a variant",
  "description": "Actualiza precio, stock, SKU o inventory_levels de una variante específica.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true },
    { "name": "variant_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "price", "type": "string", "required": false },
    { "name": "stock", "type": "integer", "required": false },
    { "name": "sku", "type": "string", "required": false },
    { "name": "inventory_levels", "type": "array", "required": false, "description": "Array de {location_id, stock} para MultiCD" }
  ],
  "requestExample": {
    "body": {
      "price": "45.00",
      "stock": 10,
      "inventory_levels": [
        { "location_id": "loc_abc123", "stock": 10 }
      ]
    }
  },
  "statusCodes": [
    { "code": 200, "description": "Variante actualizada" },
    { "code": 404, "description": "No encontrada" }
  ],
  "scopes": ["write_products"],
  "resource": "product_variants"
}
``` [11](#0-10)

---

### Endpoint 10 — Delete Variant

```json
{
  "method": "DELETE",
  "path": "/v1/{store_id}/products/{product_id}/variants/{variant_id}",
  "summary": "Delete a variant",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true },
    { "name": "variant_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "description": "Variante eliminada" }],
  "scopes": ["write_products"],
  "notes": "INFERIDO — convención REST estándar de la plataforma.",
  "resource": "product_variants"
}
````

---

## RESOURCE: Product Images

### Endpoint 11 — List Product Images

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/products/{product_id}/images",
  "summary": "List product images",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true }
  ],
  "scopes": ["read_products"],
  "statusCodes": [{ "code": 200, "description": "Lista de imágenes" }],
  "resource": "product_images"
}
```

---

### Endpoint 12 — Create Product Image

````json
{
  "method": "POST",
  "path": "/v1/{store_id}/products/{product_id}/images",
  "summary": "Add image to product",
  "description": "Asocia una imagen a un producto mediante URL. La plataforma descarga y almacena la imagen.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "src", "type": "string", "required": true, "description": "URL pública de la imagen" },
    { "name": "position", "type": "integer", "required": false, "description": "Orden de la imagen — INFERIDO" },
    { "name": "variant_ids", "type": "array", "required": false, "description": "IDs de variantes asociadas — INFERIDO" }
  ],
  "requestExample": {
    "body": { "src": "https://example.com/image.jpg" }
  },
  "statusCodes": [
    { "code": 201, "description": "Imagen creada" },
    { "code": 422, "description": "URL inválida" }
  ],
  "scopes": ["write_products"],
  "resource": "product_images"
}
``` [12](#0-11)

---

### Endpoint 13 — Delete Product Image

```json
{
  "method": "DELETE",
  "path": "/v1/{store_id}/products/{product_id}/images/{image_id}",
  "summary": "Delete a product image",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "product_id", "type": "integer", "required": true },
    { "name": "image_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "description": "Imagen eliminada" }],
  "scopes": ["write_products"],
  "notes": "INFERIDO — convención REST estándar.",
  "resource": "product_images"
}
````

---

## RESOURCE: Variant Custom Fields

### Endpoint 14 — List Custom Fields

````json
{
  "method": "GET",
  "path": "/v1/{store_id}/products/variants/custom-fields",
  "summary": "List variant custom fields",
  "description": "Retorna los campos personalizados definidos para variantes. Usados para metadata adicional o filtros en el storefront.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "description": "Lista de custom fields" }],
  "scopes": ["read_products"],
  "resource": "variant_custom_fields"
}
``` [13](#0-12)

---

### Endpoint 15 — Create Custom Field

```json
{
  "method": "POST",
  "path": "/v1/{store_id}/products/variants/custom-fields",
  "summary": "Create a variant custom field",
  "description": "Crea un nuevo campo personalizado para variantes. El value_type define el tipo de dato aceptado.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "name", "type": "string", "required": true, "description": "Nombre del campo" },
    { "name": "value_type", "type": "string", "required": true, "description": "Tipo de valor. Ej: 'text_list'" },
    { "name": "description", "type": "string", "required": false }
  ],
  "requestExample": {
    "body": {
      "name": "Material",
      "value_type": "text_list"
    }
  },
  "statusCodes": [
    { "code": 201, "description": "Campo creado" },
    { "code": 422, "description": "Error de validación" }
  ],
  "scopes": ["write_products"],
  "resource": "variant_custom_fields"
}
``` [14](#0-13)

---

### Endpoint 16 — Update Custom Field

```json
{
  "method": "PUT",
  "path": "/v1/{store_id}/products/variants/custom-fields/{custom_field_id}",
  "summary": "Update a variant custom field value",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "custom_field_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "value", "type": "string | array", "required": false, "description": "Nuevo valor del campo" }
  ],
  "statusCodes": [{ "code": 200, "description": "Campo actualizado" }],
  "scopes": ["write_products"],
  "resource": "variant_custom_fields"
}
``` [15](#0-14)

---

## RESOURCE: Categories

### Endpoint 17 — List Categories

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/categories",
  "summary": "List all categories",
  "description": "Retorna todas las categorías de la tienda incluyendo subcategorías. Las subcategorías tienen el campo parent con el ID de la categoría padre.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true }
  ],
  "queryParams": [
    { "name": "page", "type": "integer", "required": false },
    { "name": "per_page", "type": "integer", "required": false, "description": "Max 200" },
    { "name": "language", "type": "string", "required": false, "description": "INFERIDO" }
  ],
  "statusCodes": [{ "code": 200, "description": "Lista de categorías" }],
  "scopes": ["read_products"],
  "resource": "categories"
}
``` [16](#0-15)

---

### Endpoint 18 — Create Category

```json
{
  "method": "POST",
  "path": "/v1/{store_id}/categories",
  "summary": "Create a category or subcategory",
  "description": "Crea una categoría. Para crear subcategorías, incluir el campo parent con el ID de la categoría padre.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "name", "type": "string | object", "required": true, "description": "Nombre. Multilingüe: {\"pt\": \"Roupas\", \"en\": \"Clothing\", \"es\": \"Ropa\"}" },
    { "name": "description", "type": "string | object", "required": false },
    { "name": "handle", "type": "string | object", "required": false, "description": "Slug URL" },
    { "name": "parent", "type": "integer", "required": false, "description": "ID de categoría padre (para subcategorías)" }
  ],
  "requestExample": {
    "body_category": {
      "name": { "pt": "Roupas", "en": "Clothing", "es": "Ropa" }
    },
    "body_subcategory": {
      "name": { "pt": "Camisetas", "en": "T-Shirts", "es": "Camisetas" },
      "parent": 12345
    }
  },
  "statusCodes": [
    { "code": 201, "description": "Categoría creada" },
    { "code": 422, "description": "Error de validación" }
  ],
  "scopes": ["write_products"],
  "resource": "categories"
}
``` [17](#0-16)

---

### Endpoint 19 — Get Category

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/categories/{category_id}",
  "summary": "Get a single category",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "category_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "description": "Categoría encontrada" }, { "code": 404, "description": "No encontrada" }],
  "scopes": ["read_products"],
  "resource": "categories"
}
````

---

### Endpoint 20 — Update Category

````json
{
  "method": "PUT",
  "path": "/v1/{store_id}/categories/{category_id}",
  "summary": "Update a category",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "category_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "name", "type": "string | object", "required": false },
    { "name": "description", "type": "string | object", "required": false },
    { "name": "handle", "type": "string | object", "required": false },
    { "name": "parent", "type": "integer", "required": false }
  ],
  "statusCodes": [{ "code": 200, "description": "Categoría actualizada" }],
  "scopes": ["write_products"],
  "resource": "categories"
}
``` [18](#0-17)

---

### Endpoint 21 — Delete Category

```json
{
  "method": "DELETE",
  "path": "/v1/{store_id}/categories/{category_id}",
  "summary": "Delete a category",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "category_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "description": "Categoría eliminada" }],
  "scopes": ["write_products"],
  "notes": "INFERIDO — convención REST estándar.",
  "resource": "categories"
}
````

---

## RESOURCE: Orders

### Endpoint 22 — List Orders

````json
{
  "method": "GET",
  "path": "/v1/{store_id}/orders",
  "summary": "List orders",
  "description": "Retorna la lista paginada de pedidos. IMPORTANTE: usar el campo 'id' (10 dígitos, interno) para todas las operaciones de integración, NO el campo 'number' (visible al cliente).",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true }
  ],
  "queryParams": [
    { "name": "page", "type": "integer", "required": false },
    { "name": "per_page", "type": "integer", "required": false, "description": "Max 200" },
    { "name": "since_id", "type": "integer", "required": false, "description": "INFERIDO" },
    { "name": "status", "type": "string", "required": false, "description": "INFERIDO: open, closed, cancelled" },
    { "name": "payment_status", "type": "string", "required": false, "description": "INFERIDO" },
    { "name": "shipping_status", "type": "string", "required": false, "description": "INFERIDO" },
    { "name": "created_at_min", "type": "string", "required": false, "description": "INFERIDO — ISO 8601" },
    { "name": "created_at_max", "type": "string", "required": false, "description": "INFERIDO — ISO 8601" }
  ],
  "requestExample": {
    "curl": "curl -H 'Authentication: bearer ACCESS_TOKEN' -H 'User-Agent: MyApp (name@email.com)' 'https://api.tiendanube.com/v1/123456/orders?page=1&per_page=200'"
  },
  "statusCodes": [
    { "code": 200, "description": "Lista de pedidos" },
    { "code": 401, "description": "Token inválido" },
    { "code": 429, "description": "Rate limit excedido" }
  ],
  "rateLimits": "Leaky Bucket: 40 req / 2 per sec",
  "scopes": ["read_orders"],
  "notes": "Usar 'id' (interno, 10 dígitos) para sincronización. El campo 'number' es solo para display al cliente.",
  "resource": "orders"
}
``` [19](#0-18)

---

### Endpoint 23 — Get Order

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/orders/{order_id}",
  "summary": "Get a single order",
  "description": "Retorna los detalles completos de un pedido incluyendo items, cliente, envío y pagos.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "order_id", "type": "integer", "required": true, "description": "ID interno del pedido (10 dígitos)" }
  ],
  "requestExample": {
    "curl": "curl -H 'Authentication: bearer ACCESS_TOKEN' -H 'User-Agent: MyApp (name@email.com)' https://api.tiendanube.com/v1/123456/orders/9876543210"
  },
  "statusCodes": [
    { "code": 200, "description": "Pedido encontrado" },
    { "code": 404, "description": "Pedido no encontrado" }
  ],
  "scopes": ["read_orders"],
  "notes": "El webhook de order/created/updated entrega store_id + order_id. Usar este endpoint para obtener el payload completo.",
  "resource": "orders"
}
``` [20](#0-19)

---

### Endpoint 24 — Update Order

```json
{
  "method": "PUT",
  "path": "/v1/{store_id}/orders/{order_id}",
  "summary": "Update order status",
  "description": "Actualiza el estado de pago o envío de un pedido. INFERIDO — la documentación menciona actualización de status pero no detalla el body completo.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "order_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "payment_status", "type": "string", "required": false, "description": "INFERIDO: paid, pending, refunded, voided" },
    { "name": "shipping_status", "type": "string", "required": false, "description": "INFERIDO: shipped, unshipped, fulfilled" }
  ],
  "statusCodes": [
    { "code": 200, "description": "Pedido actualizado" },
    { "code": 422, "description": "Transición de estado inválida" }
  ],
  "scopes": ["write_orders"],
  "notes": "PARCIALMENTE INFERIDO — la doc menciona actualización de payment y shipping status pero no el schema exacto del body.",
  "resource": "orders"
}
````

---

## RESOURCE: Order Metafields (Invoices / NFe)

### Endpoint 25 — Create Order Metafield (Invoice)

````json
{
  "method": "POST",
  "path": "/v1/{store_id}/orders/{order_id}/metafields",
  "summary": "Create order metafield (attach invoice/NFe)",
  "description": "Asocia metadatos a un pedido. El caso de uso principal para ERPs es adjuntar notas fiscais (NFe) usando namespace 'nfe' y key 'list'. El value es un JSON string con array de objetos de factura.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "order_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "namespace", "type": "string", "required": true, "description": "Namespace del metafield. Para NFe: 'nfe'" },
    { "name": "key", "type": "string", "required": true, "description": "Clave del metafield. Para NFe: 'list'" },
    { "name": "value", "type": "string", "required": true, "description": "JSON string con los datos. Para NFe: array de objetos con key, link, fulfillment_order_id" },
    { "name": "value_type", "type": "string", "required": false, "description": "Tipo del valor. INFERIDO: 'json_string', 'string', 'integer'" }
  ],
  "requestExample": {
    "body": {
      "namespace": "nfe",
      "key": "list",
      "value": "[{\"key\": \"35240312345678000195550010000012341234567890\", \"link\": \"https://example.com/nfe/12345.xml\", \"fulfillment_order_id\": 67890}]"
    }
  },
  "statusCodes": [
    { "code": 201, "description": "Metafield creado" },
    { "code": 422, "description": "Error de validación" }
  ],
  "scopes": ["write_orders"],
  "notes": "El campo 'value' debe ser un JSON string (no objeto). El fulfillment_order_id vincula la factura al fulfillment específico en tiendas MultiCD.",
  "resource": "order_metafields"
}
``` [21](#0-20)

---

### Endpoint 26 — List Order Metafields

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/orders/{order_id}/metafields",
  "summary": "List order metafields",
  "description": "Retorna todos los metafields asociados a un pedido.",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "order_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "description": "Lista de metafields" }],
  "scopes": ["read_orders"],
  "notes": "INFERIDO — convención estándar de metafields en la plataforma.",
  "resource": "order_metafields"
}
````

---

## RESOURCE: Fulfillment Orders

### Endpoint 27 — List Fulfillment Orders

````json
{
  "method": "GET",
  "path": "/v1/{store_id}/orders/{order_id}/fulfillment-orders",
  "summary": "List fulfillment orders for an order",
  "description": "En tiendas con MultiCD (múltiples depósitos), un pedido se divide en Fulfillment Orders, cada uno representando un envío desde un depósito específico.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "order_id", "type": "integer", "required": true }
  ],
  "responseFields": [
    { "name": "id", "type": "integer", "description": "ID del fulfillment order" },
    { "name": "location_id", "type": "string", "description": "ID del depósito de origen" },
    { "name": "items", "type": "array", "description": "Items a despachar desde este depósito" }
  ],
  "statusCodes": [{ "code": 200, "description": "Lista de fulfillment orders" }],
  "scopes": ["read_orders"],
  "resource": "fulfillment_orders"
}
``` [22](#0-21)

---

## RESOURCE: Tracking Events

### Endpoint 28 — Create Tracking Event

```json
{
  "method": "POST",
  "path": "/v1/{store_id}/orders/{order_id}/fulfillment-orders/{fulfillment_order_id}/tracking-events",
  "summary": "Add tracking event to fulfillment order",
  "description": "Registra un evento de seguimiento de envío en un fulfillment order. Permite actualizar el estado logístico del pedido (despachado, en tránsito, entregado, etc.).",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "order_id", "type": "integer", "required": true },
    { "name": "fulfillment_order_id", "type": "integer", "required": true }
  ],
  "bodyParams": [
    { "name": "status", "type": "string", "required": true, "description": "Estado del envío. Valores documentados: 'dispatched', 'in_transit'. INFERIDO también: 'delivered', 'returned', 'failed'" },
    { "name": "happened_at", "type": "string", "required": false, "description": "Timestamp ISO 8601 del evento" },
    { "name": "description", "type": "string", "required": false, "description": "Descripción del evento — INFERIDO" },
    { "name": "tracking_number", "type": "string", "required": false, "description": "Número de tracking — INFERIDO" }
  ],
  "requestExample": {
    "body": {
      "status": "dispatched",
      "happened_at": "2024-01-15T10:30:00Z"
    }
  },
  "statusCodes": [
    { "code": 201, "description": "Evento de tracking creado" },
    { "code": 422, "description": "Status inválido" }
  ],
  "scopes": ["write_orders"],
  "resource": "tracking_events"
}
``` [23](#0-22)

---

## RESOURCE: Webhooks

### Endpoint 29 — List Webhooks

```json
{
  "method": "GET",
  "path": "/v1/{store_id}/webhooks",
  "summary": "List registered webhooks",
  "pathParams": [{ "name": "store_id", "type": "integer", "required": true }],
  "statusCodes": [{ "code": 200, "description": "Lista de webhooks" }],
  "scopes": ["read_orders"],
  "resource": "webhooks"
}
````

---

### Endpoint 30 — Create Webhook

````json
{
  "method": "POST",
  "path": "/v1/{store_id}/webhooks",
  "summary": "Register a webhook",
  "description": "Registra un webhook para recibir notificaciones de eventos en tiempo real. Obligatorio para ERPs — evita polling.",
  "authentication": { "type": "oauth2", "headers": ["Authentication", "User-Agent", "Content-Type"] },
  "pathParams": [{ "name": "store_id", "type": "integer", "required": true }],
  "bodyParams": [
    { "name": "event", "type": "string", "required": true, "description": "Evento a escuchar. Valores documentados: 'order/created', 'order/updated', 'order/cancelled', 'app/suspended', 'app/uninstalled'" },
    { "name": "url", "type": "string", "required": true, "description": "URL HTTPS del endpoint receptor" }
  ],
  "requestExample": {
    "body": {
      "event": "order/created",
      "url": "https://my-erp.com/webhooks/nuvemshop/orders"
    }
  },
  "responseExample": {
    "note": "Payload recibido en el webhook: { store_id: N, event: 'order/created', id: ORDER_ID }"
  },
  "statusCodes": [
    { "code": 201, "description": "Webhook registrado" },
    { "code": 422, "description": "URL inválida o evento no soportado" }
  ],
  "scopes": ["write_orders"],
  "notes": "El endpoint receptor debe responder 200 OK inmediatamente antes de procesar la lógica pesada para evitar timeouts y retries. El payload solo contiene store_id + event + id — hacer GET /orders/{id} para obtener datos completos.",
  "resource": "webhooks"
}
``` [24](#0-23) [25](#0-24)

---

### Endpoint 31 — Delete Webhook

```json
{
  "method": "DELETE",
  "path": "/v1/{store_id}/webhooks/{webhook_id}",
  "summary": "Delete a webhook",
  "pathParams": [
    { "name": "store_id", "type": "integer", "required": true },
    { "name": "webhook_id", "type": "integer", "required": true }
  ],
  "statusCodes": [{ "code": 200, "

### Citations

**File:** docs/developer-tools/nuvemshop-api.md (L19-21)
```markdown
Para interagir com a nossa API de produtos, todos os URLs começam com `https://api.tiendanube.com/v1/{store_id}` ou `https://api.nuvemshop.com.br/v1/{store_id}`, garantindo a segurança por meio do **SSL**. O caminho é prefixado com o ID da loja e a versão da API. Caso haja mudanças incompatíveis com versões anteriores, faremos o incremento da versão para garantir suporte estável aos URLs antigos.

Suponhamos que você queira acessar a loja com o ID `123456` por meio da API. A URL será `https://api.tiendanube.com/v1/123456` ou `https://api.nuvemshop.com.br/v1/123456`.
````

**File:** docs/developer-tools/nuvemshop-api.md (L25-29)

````markdown
```bash
curl -H 'Authentication: bearer ACCESS_TOKEN' \
-H 'User-Agent: MyApp (name@email.com)' \
https://api.tiendanube.com/v1/123456/products
```
````

````

**File:** docs/developer-tools/nuvemshop-api.md (L37-47)
```markdown
  ```bash
  curl -H 'Authentication: bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: MyApp (name@email.com)' \
  -d '{ "name": "Meu novo produto" }' \
  https://api.tiendanube.com/v1/123456/products
````

Lembre-se de substituir `ACCESS_TOKEN` pelo token de acesso da loja para o seu aplicativo ([consulte Autenticação](../applications/authentication.md)) e ajustar o nome do produto conforme necessário. Isso permitirá que você crie um novo produto na loja identificada pelo ID `123456`.

Essa solicitação, em caso de sucesso, deve retornar o produto criado no seguinte [formato](https://tiendanube.github.io/api-documentation/resources/product#post-products).

````

**File:** docs/erp-guide/api-usage.md (L1-45)
```markdown
---
sidebar_position: 3
title: Controle de uso da API
---

## Rate Limit - Controle de Uso da API

Atualmente, utilizamos o algoritmo Leaky Bucket para limitar o uso da API.

Por padrão, o bucket tem capacidade para **40 requisições**, com uma taxa de vazão (leaky rate) de 2 requisições por segundo.

Isso significa que você pode fazer até **2 requisições por segundo** em pacotes de até **40 requisições**, sem receber o erro **429 (Too Many Requests)**.

Para monitorar o consumo da API, disponibilizamos os seguintes cabeçalhos:

- **x-rate-limit-limit**: Total de requisições permitidas em um dado período (equivalente ao tamanho do bucket).
- **x-rate-limit-remaining**: Número de requisições restantes para preencher o bucket.
- **x-rate-limit-reset**: Tempo restante, em milissegundos, para o bucket ser completamente esvaziado.

**Observação importante**: O limite de uso da API é aplicado individualmente para cada loja e aplicativo.

**Para lojas nos planos Next ou Evolution (planos superiores), o limite de taxa é multiplicado por 10, permitindo maior capacidade de requisições.**

## Filtros Gerais e Paginação

Requisições que retornam múltiplos itens **não possuem paginação habilitada por padrão**.

Para navegar pelos resultados, é necessário usar o parâmetro **page** para especificar páginas adicionais.

Além disso, você pode personalizar o tamanho de cada página utilizando o parâmetro **per_page**, que aceita valores de até **200 itens por página**.

A numeração das páginas começa em 1. Se o parâmetro page for omitido, a requisição retornará a primeira página por padrão.

**Informações úteis:**

- **Contagem total de resultados**: O cabeçalho **x-total-count** indica a quantidade total de itens disponíveis.

```bash
x-total-count: 156
````

**Links para navegação**: O cabeçalho Link fornece os URLs para as páginas seguinte e anterior, facilitando a implementação de paginação.

Esse mecanismo permite obter os resultados de forma organizada e eficiente, mesmo em grandes conjuntos de dados.

````

**File:** docs/applications/authentication.md (L109-125)
```markdown
```javascript
{
    "access_token": "88a2fdd17e10327ed96f4f2dc96b00bca60dfe60",
    "token_type": "bearer",
    "scope": "write_products",
    "user_id": 2093261
}
````

Você pode montar o comando cURL manualmente com base no exemplo fornecido. Aqui está o comando cURL para realizar a requisição POST utilizando as informações mencionadas:

```bash
curl -X POST "https://www.tiendanube.com/apps/authorize/token" \
-d "client_id=client_id" \
-d "client_secret=client_secret" \
-d "code=code"
```

````

**File:** docs/erp-guide/catalog/products.md (L23-43)
```markdown
- **SKU:** Cada produto é identificado por um código SKU, gerado do lado do ERP/PIM.
- **Gerenciamento direto de estoque:** O controle de estoque, preço e outros atributos é feito diretamente no nível do produto.

**Produtos com Variação**
Esses produtos oferecem opções para os clientes, como tamanho, cor ou material.

Cada combinação de opções é chamada de variante, e essas variantes compartilham o mesmo produto base.

**Como funcionam os atributos e valores?**

Os produtos com variação utilizam os conceitos de **attributes** (atributos) e **values** (valores):

- **Atributos (attributes):** Representam as opções disponíveis para o produto. Exemplos:
    - Tamanho
    - Cor
    - Material

- **Valores (values):** São as escolhas dentro de cada atributo. Exemplos:
    - Para o atributo "Tamanho": P, M, G.
    - Para o atributo "Cor": Azul, Vermelho, Preto.
    - Cada variante é formada por uma combinação específica de valores para os atributos do produto.
````

**File:** docs/erp-guide/catalog/products.md (L64-69)

```markdown
"inventory_levels": [
{
"location_id": "01GQ2ZHK064BQRHGDB7CCV0Y6N",
"stock": 5
}
],
```

**File:** docs/erp-guide/catalog/products.md (L107-108)

```markdown
Permite alterar informações específicas de uma **variante de produto (SKU)**.
```

**File:** docs/erp-guide/catalog/products.md (L149-159)

````markdown
[Requisição de exemplo para adicionar uma imagem:](https://tiendanube.github.io/api-documentation/resources/product-image)

```bash
curl -X POST https://api.nuvemshop.com/v1/{{store_id}}/products/98765/images \
-H 'Authentication: bearer {{app_token}}' \
-H 'User-Agent: Your App Name ({{app_id}})' \
-H 'Content-Type: application/json' \
-d '{
  "src": "https://example.com/image2.jpg"
}'
```
````

````

**File:** docs/erp-guide/catalog/variant-custom-fields.md (L19-20)
```markdown
[GET /products/variants/custom-fields](https://tiendanube.github.io/api-documentation/resources/products/variants/custom-fields#get-productsvariantsidcustom-fields)

````

**File:** docs/erp-guide/catalog/variant-custom-fields.md (L32-42)

````markdown
POST /products/variants/custom-fields

```bash
curl -X POST https://api.nuvemshop.com/v1/{{store_id}}/products/variants/custom-fields \
-H 'Authentication: bearer {{app_token}}' \
-H 'User-Agent: Your App Name ({{app_id}})' \
-H 'Content-Type: application/json' \
-d '{
    "name": "Production status",
    "description": "Possible product production status",
    "value_type": "text_list",
```
````

**File:** docs/erp-guide/catalog/variant-custom-fields.md (L56-59)

````markdown
PUT /products/variants/custom-fields/{{custom-field_id}}

```bash
curl -X PUT https://api.nuvemshop.com/v1/{{store_id}}/products/variants/custom-fields/{{custom-field_id}} \
```
````

**File:** docs/erp-guide/catalog/categories.md (L8-15)

```markdown
**Criação de uma Categoria**

Para criar uma nova categoria, faça uma requisição [POST para o endpoint /categories](https://tiendanube.github.io/api-documentation/resources/category#post-categories).

Certifique-se de incluir os seguintes cabeçalhos:

- Authentication: bearer {{app_token}}
- User-Agent: Your App Name ({{app_id}})
  Exemplo em curl:
```

**File:** docs/erp-guide/catalog/categories.md (L47-52)

```markdown
**Criação de uma Subcategoria**

O processo para criar uma subcategoria é semelhante ao da criação de uma categoria.

Você deve especificar o [ID da categoria pai no campo parent](https://tiendanube.github.io/api-documentation/resources/category#post-categories-2).
```

**File:** docs/erp-guide/catalog/categories.md (L80-82)

```markdown
**Atualização de uma Categoria ou Subcategoria**

Para atualizar uma categoria ou subcategoria existente, faça uma requisição [PUT para o endpoint /categories/{id}](https://tiendanube.github.io/api-documentation/resources/category#put-categoriesid), onde **{id}** é o ID da categoria que deseja atualizar.
```

**File:** docs/erp-guide/orders/overview.md (L15-22)

```markdown
Identificação dos pedidos

**Na Nuvemshop, existem dois identificadores de pedido:**

**NUMBER** – Exibido para os clientes em um formato amigável, porém não é aceito como identificador para integrações.
**ID do pedido** – Um identificador interno composto por 10 dígitos, utilizado oficialmente pela plataforma.

Para fins de integração, o mais adequado é utilizar o **ID do pedido interno**, pois ele garante maior precisão na comunicação entre sistemas e evita possíveis conflitos ou erros que poderiam ocorrer ao tentar usar o NUMBER, que, apesar de ser fixo, não é suportado para esse fim.
```

**File:** docs/erp-guide/orders/webhooks.md (L6-24)

````markdown
**Criar um Webhook para Pedidos**

Registra um novo webhook para eventos relacionados aos pedidos.

[POST /webhooks](https://tiendanube.github.io/api-documentation/resources/webhook#post-webhooks)

```bash
curl -X POST https://api.nuvemshop.com/v1/{{store_id}}/webhooks \
-H 'Authentication: bearer {{app_token}}' \
-H 'User-Agent: Your App Name ({{app_id}})' \
-H 'Content-Type: application/json' \
-d '{
  "event": "order/created",
  "url": "https://seusistema.com.br/webhooks/orders",
  "headers": {
    "Custom-Header": "Valor"
  }
}'
```
````

````

**File:** docs/erp-guide/orders/webhooks.md (L69-81)
```markdown
**Processar Notificações Recebidas**

Quando um evento configurado ocorre, sua aplicação receberá um POST com os seguintes dados:

Exemplo de Payload de Notificação:

```bash
{
  "store_id": 5665778,
  "event": "order/created",
  "id": 1639882221
}
````

````

**File:** docs/erp-guide/orders/invoices.md (L8-31)
```markdown
A API da Nuvemshop permite criar e gerenciar faturas (invoices) para pedidos de forma programática.

Abaixo estão as principais ações relacionadas à criação e gestão de faturas, conforme a documentação oficial.

**Criar uma Fatura**

Cria uma fatura para um pedido específico. As faturas são documentos fiscais associados a um pedido.

[POST /metafields](https://tiendanube.github.io/api-documentation/resources/order#create-an-invoice)

```bash
curl -X POST https://api.nuvemshop.com/v1/{{store_id}}/orders/{{order_id}}/metafields \
-H 'Authentication: bearer {{app_token}}' \
-H 'User-Agent: Your App Name ({{app_id}})' \
-H 'Content-Type: application/json' \
-d '{
  "namespace": "nfe",
  "key": "list",
  "value": "[{\"key\": \"55555555555555555555555555555\", \"link\": \"http://nfe.com.br/nsaasb\", \"fulfillment_order_id\": \"01FHZXHK8PTP9FVK99Z66GXASS\"}]",
  "description": "Lista de NFes",
  "owner_resource": "Order",
  "owner_id": 12345678
}'
````

````

**File:** docs/erp-guide/orders/management.md (L91-96)
```markdown
**Fulfillment Order**

O Fulfillment Order na Nuvemshop é um recurso que permite gerenciar envios de pedidos quando há múltiplas origens (locations).

Ele separa um pedido em diferentes "ordens de atendimento" (fulfillment orders), cada uma representando um envio específico com seus produtos, custos e métodos de entrega.

````

**File:** docs/erp-guide/orders/management.md (L119-134)

````markdown
Criar um evento
**POST** /v1/{store_id}/orders/{order_id}/fulfillment-orders/{fulfillment_order_id}/tracking-events

```bash
{
   "status": "dispatched",
   "description": "The package was dispatched",
   "address": "St. Paul 123, São Paulo - Brazil 02910802",
   "geolocation": {
      "longitude": 73.856077,
      "latitude": 40.848447
   },
   "happened_at": "2022-11-24T10:20:19+00:00",
   "estimated_delivery_at": "2022-11-24T10:20:19+00:00"
}
```
````

````

**File:** docs/erp-guide/guidelines.md (L51-65)
```markdown
- ``app/suspended``  **(Aplicativo Suspenso):** Indica que o aplicativo foi desativado temporariamente.
- ``app/uninstalled`` **(Aplicativo Desinstalado):** Indica que o lojista removeu a integração, desinstalando-o.

#### 2. Por que implementar o `app/suspended`?

Ouvir este evento permite que sua plataforma conheça o estado exato da loja em tempo real. Ao receber este alerta, sua aplicação deve:

- **Cessar Requisições:** Interromper imediatamente qualquer chamada à API para aquela loja específica.
- **Evitar Erros:** Impedir que sua infraestrutura execute requisições inválidas que resultariam em erros de autenticação.
- **Ações Internas:** Realizar os procedimentos de limpeza ou pausa de serviços agendados no seu banco de dados.

#### 3. Boas Práticas de uso do webhook

- **Resiliência:** Certifique-se de que seu endpoint de webhook responda com um status `200 OK` rapidamente para evitar retentativas desnecessárias por parte do servidor de origem.
- **Log de Eventos:** Mantenha um registro de quando esses eventos foram recebidos para facilitar auditorias técnicas.
````
