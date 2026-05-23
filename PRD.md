# Product Requirements Document (PRD) — mcp-tiendanube

Servidor MCP para gestion de catalogos de productos en Tiendanube.

---

## 1. Resumen Ejecutivo

mcp-tiendanube es un servidor MCP (Model Context Protocol) que expone 7 herramientas de alto nivel para que los LLMs gestionen catalogos de productos en Tiendanube sin conocer los detalles de la API REST. El servidor esta construido sobre xmcp 0.6.10, utiliza Bun como runtime, Zod v4 para validacion de entrada, y una arquitectura de 4 capas que separa herramientas, servicios, adaptadores y cliente HTTP.

El MVP (Fase 1) esta completo con 7 herramientas funcionales, 70 tests, 91.02% de cobertura de lineas, y build exitoso. El servidor no almacena estado local; todas las operaciones son passthrough hacia la API v1 de Tiendanube.

---

## 2. Objetivo del Producto

Permitir que asistentes de inteligencia artificial (Claude, GPT, etc.) conectados via MCP realicen operaciones de gestion de productos en Tiendanube mediante instrucciones en lenguaje natural, traducidas automaticamente a llamadas de herramientas MCP.

El objetivo es eliminar la curva de aprendizaje de la API REST de Tiendanube para los usuarios finales y reducir la cantidad de pasos manuales necesarios para administrar un catalogo de e-commerce.

---

## 3. Problema que Resuelve

**Problema actual**:

- Los comerciantes de Tiendanube necesitan navegar el panel de administracion web para cada tarea de producto.
- Los LLMs no pueden interactuar directamente con Tiendanube porque no existe un conector MCP estandar.
- La API REST de Tiendanube requiere conocimiento de endpoints, autenticacion OAuth, manejo de paginacion y formatos de payload.
- Las herramientas genericas (como `fetch` via MCP) no ofrecen validacion de entrada ni mapeo de errores amigables.

**Solucion**:

- Un servidor MCP dedicado que expone herramientas semantica y orientadas a tareas.
- Validacion estricta de entrada via Zod con mensajes de error claros.
- Mapeo de errores de API a mensajes comprensibles para el LLM.
- Arquitectura extensible que permite agregar dominios (ordenes, clientes) sin reescribir el nucleo.

---

## 4. Usuarios Objetivo

| Perfil                   | Rol                        | Necesidad                                                          |
| ------------------------ | -------------------------- | ------------------------------------------------------------------ |
| Comerciante individual   | Dueño de tienda Tiendanube | Gestionar catalogo sin conocimientos tecnicos de API               |
| Agencia de e-commerce    | Equipo tecnico             | Automatizar tareas repetitivas de producto para multiples clientes |
| Desarrollador integrador | Creador de flujos de IA    | Conectar LLMs con Tiendanube via MCP estandar                      |
| Soporte al cliente       | Atencion post-venta        | Consultar stock, actualizar precios, verificar ordenes rapidamente |

---

## 5. Casos de Uso Principales

### Caso de Uso 1: Actualizacion masiva de precios

**Actor**: Comerciante
**Flujo**: El comerciante pide al asistente de IA: "Subi un 10% el precio de todos los productos de la categoria Zapatillas". El LLM usa `list-products` para obtener los productos, calcula los nuevos precios, y usa `update-products` para aplicar los cambios en batch.
**Valor**: Ahorra horas de edicion manual en el panel.

### Caso de Uso 2: Gestion de stock bajo

**Actor**: Soporte al cliente
**Flujo**: El asistente detecta productos con stock 0 via `list-products` con `stock_status: "out_of_stock"`, y notifica al comerciante. El comerciante pide: "Recarga 50 unidades de stock para el SKU SHOE-42". El LLM usa `get-product` para encontrar el producto, identifica la variante correcta, y usa `update-stock` para actualizar.
**Valor**: Prevencion de perdida de ventas por stock agotado.

### Caso de Uso 3: Lanzamiento de nuevo producto con variantes

**Actor**: Agencia de e-commerce
**Flujo**: El asistente crea un producto base en Tiendanube (via panel o API directa), luego usa `manage-variants` para agregar variantes de talle y color. Usa `manage-images` para subir las imagenes del producto. Finalmente usa `update-stock` para asignar stock inicial a cada variante.
**Valor**: Reduccion de tiempo de setup de producto de 30 minutos a 2 minutos.

### Caso de Uso 4: Depuracion de catalogo

**Actor**: Desarrollador integrador
**Flujo**: El desarrollador pide al LLM: "Mostrame todos los productos que tienen variantes sin stock". El LLM usa `list-products` para listar, `get-product` para inspeccionar cada uno, y genera un reporte de productos que necesitan atencion.
**Valor**: Auditoria automatizada del catalogo sin scripts personalizados.

### Caso de Uso 5: Eliminacion segura de productos obsoletos

**Actor**: Comerciante
**Flujo**: El comerciante pide: "Elimina el producto 'Gorra Vieja Modelo 2023'". El LLM confirma la intencion, obtiene el ID via `list-products`, y ejecuta `delete-product` con `confirm: true`.
**Valor**: Prevencion de eliminaciones accidentales gracias al mecanismo de confirmacion.

### Caso de Uso 6: Reordenamiento de imagenes

**Actor**: Agencia de e-commerce
**Flujo**: El asistente identifica que la imagen principal de un producto no es la deseada. Usa `get-product` para ver el orden actual, luego `manage-images` con `action: "reorder"` para colocar la imagen correcta en posicion 1.
**Valor**: Mejora de presentacion de producto sin acceso al panel.

### Caso de Uso 7: Consulta rapida de detalle de producto

**Actor**: Soporte al cliente
**Flujo**: Un cliente pregunta por telefono si hay stock del producto X en talle L. El soporte pide al asistente: "Busca el producto 'Remera Azul' y decime si hay talle L". El LLM usa `list-products` para buscar, `get-product` para ver variantes, y responde instantaneamente.
**Valor**: Atencion al cliente mas rapida y precisa.

---

## 6. Alcance del MVP

El MVP (version 0.1.1) incluye exactamente 8 herramientas MCP, todas orientadas al dominio de productos:

| #   | Herramienta       | Tipo      | Descripcion                                                  |
| --- | ----------------- | --------- | ------------------------------------------------------------ |
| 1   | `list-products`   | Lectura   | Listado paginado con filtros por stock y busqueda            |
| 2   | `get-product`     | Lectura   | Detalle completo incluyendo variantes e imagenes             |
| 3   | `create-product`  | Escritura | Crear nuevo producto con variantes e imagenes en una llamada |
| 4   | `update-products` | Escritura | Actualizacion masiva de atributos de producto                |
| 5   | `manage-variants` | Escritura | Crear, actualizar o eliminar variantes de un producto        |
| 6   | `manage-images`   | Escritura | Agregar, eliminar o reordenar imagenes de producto           |
| 7   | `update-stock`    | Escritura | Actualizar niveles de stock de variantes en batch            |
| 8   | `delete-product`  | Escritura | Eliminar producto con confirmacion obligatoria               |

**Lo que el MVP NO incluye**:

- Autenticacion OAuth (usa token estatico de entorno).
- Gestion de ordenes, clientes o categorias.
- Soporte multi-tienda (un servidor = una tienda).
- Webhooks o notificaciones push.
- Cache de respuestas.
- Rate limiting proactivo (solo reactivo/backoff).
- Transporte STDIO (solo HTTP).
- Dashboard de administracion.

---

## 7. Funcionalidades Fuera del MVP

| Funcionalidad               | Fase estimada | Razon de exclusion del MVP                                       |
| --------------------------- | ------------- | ---------------------------------------------------------------- |
| Flujo OAuth 2.0             | Fase 2        | Requiere infraestructura de redireccion y persistencia de tokens |
| Rate limiting client-side   | Fase 2        | Backoff reactivo es suficiente para MVP                          |
| Cache de respuestas         | Fase 2        | Aumenta complejidad; no critico para volumen inicial             |
| Webhooks de Tiendanube      | Fase 5        | Requiere endpoint publico HTTPS                                  |
| Gestion de ordenes          | Fase 3        | Dominio separado, requiere maquina de estados                    |
| Gestion de clientes         | Fase 4        | Dominio separado, implica datos sensibles                        |
| Categorias y automatizacion | Fase 5        | Requiere arbol de categorias y motor de reglas                   |
| Multi-tenant / multi-tienda | Fase 6        | Requiere aislamiento de datos y contexto por request             |
| Dashboard de metricas       | Fase 6        | Requiere UI y persistencia de metricas                           |
| Upload directo de imagenes  | Fase 2        | MVP solo soporta agregar imagen por URL                          |
| STDIO transport             | Post-MVP      | HTTP cubre el caso de uso principal                              |

---

## 8. Requisitos Funcionales

### RF-1: list-products

**Entrada**:
| Parametro | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `page` | integer >= 1 | No | 1 | Numero de pagina |
| `search` | string | No | — | Busqueda por nombre de producto |
| `stock_status` | enum: all, in_stock, out_of_stock | No | "all" | Filtrar por disponibilidad de stock |

**Salida**:

```json
{
  "products": [
    {
      "id": "123",
      "name": "Zapatilla Running",
      "description": "...",
      "price": "89.99",
      "stock": 15,
      "variants_count": 3,
      "variants": [...],
      "images": [...]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "per_page": 50,
    "total_pages": 3
  }
}
```

**Errores**:

- Token invalido: "Invalid or expired access token — check TIENDANUBE_ACCESS_TOKEN"
- API no disponible: "Tiendanube API temporarily unavailable"

### RF-2: get-product

**Entrada**:
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | ProductId (branded string) | Si | ID unico del producto en Tiendanube |

**Salida**:

```json
{
  "product": {
    "id": "123",
    "name": "Zapatilla Running",
    "description": "...",
    "price": "89.99",
    "stock": 15,
    "variants_count": 3,
    "variants": [
      { "id": "456", "sku": "RUN-42", "price": "89.99", "stock": 5 }
    ],
    "images": [{ "id": "789", "src": "https://...", "position": 1 }]
  }
}
```

**Errores**:

- Producto no encontrado: "Resource not found (Product: 123)"
- ID invalido: error de validacion Zod antes de la llamada a API.

### RF-3: update-products

**Entrada**:
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `updates` | array de { id, updates } | Si | Minimo 1 elemento. `updates` es Product partial. |

**Salida**:

```json
{
  "results": [
    { "id": "123", "success": true, "product": {...} },
    { "id": "124", "success": false, "error": "Resource not found" }
  ],
  "summary": { "total": 2, "success": 1, "failed": 1 }
}
```

**Errores**:

- Array vacio: error de validacion Zod (`min(1)`).
- Precio invalido: "Price must be in format XX.XX".

### RF-4: manage-variants

**Entrada**:
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `product_id` | ProductId | Si | ID del producto padre |
| `action` | enum: create, update, delete | Si | Accion a realizar |
| `variant` | VariantInput | Condicional | Datos de variante (create/update) |
| `variant_id` | string | Condicional | ID de variante (update/delete) |

**Salida** (varia por accion):

- `create`: `{ action: "created", success: true, variant: {...} }`
- `update`: `{ action: "updated", success: true, variant: {...} }`
- `delete`: `{ action: "deleted", success: true, variant_id: "..." }`

**Errores**:

- `variant` faltante en create: "Variant data required for create action"
- `variant_id` faltante en update/delete: "variant_id required for ... action"

### RF-5: manage-images

**Entrada**:
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `product_id` | ProductId | Si | ID del producto |
| `action` | enum: add, remove, reorder | Si | Accion a realizar |
| `image_url` | string (URL) | Condicional | URL de imagen (add) |
| `image_id` | string | Condicional | ID de imagen (remove/reorder) |
| `position` | integer >= 1 | Condicional | Nueva posicion (reorder) |

**Salida** (varia por accion):

- `add`: `{ action: "added", image: {...}, success: true }`
- `remove`: `{ action: "removed", image_id: "...", success: true }`
- `reorder`: `{ action: "reordered", image: {...}, success: true }`

**Errores**:

- `image_url` faltante en add: "image_url required for add action"
- `image_id` y `position` faltantes en reorder: "image_id and position required for reorder action"

### RF-6: update-stock

**Entrada**:
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `variant_stock` | array de { variant_id, stock } | Si | Minimo 1. stock >= 0. |

**Salida**:

```json
{
  "results": [
    { "variant_id": "10", "success": true, "stock": 20 },
    {
      "variant_id": "11",
      "success": false,
      "error": "Stock cannot be negative"
    }
  ],
  "summary": { "total": 2, "success": 1, "failed": 1 }
}
```

**Errores**:

- Stock negativo: validacion Zod rechaza antes de llamar a la API.
- Variante no encontrada: error por item individual, no bloquea los demas.

### RF-7: delete-product

**Entrada**:
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `product_id` | ProductId | Si | ID del producto a eliminar |
| `confirm` | boolean | Si | Debe ser `true`; de lo contrario se rechaza |

**Salida**:

```json
{ "deleted": "123", "success": true }
```

**Errores**:

- `confirm !== true`: "Deletion requires confirm: true. Please confirm the deletion before proceeding."

---

## 9. Requisitos No Funcionales

### Rendimiento

- Latencia p95 de herramientas de lectura: < 2s (depende de la API de Tiendanube).
- Latencia p95 de herramientas de escritura: < 3s.
- Timeout de request HTTP: 30 segundos.

### Confiabilidad

- Backoff exponencial ante HTTP 429: 3 reintentos con delays de 1s, 2s, 4s + jitter 10%.
- Timeout de requests con `AbortController`.
- Todos los errores de API mapeados a mensajes amigables (sin exponer HTTP status crudos).
- Operaciones bulk procesan items individualmente; un item fallido no aborta los demas.

### Observabilidad

- Logging de entrada a herramientas (sin tokens).
- Logging de errores de API a nivel ERROR con cuerpo de respuesta.
- Build reproducible: `bun run build` genera artefactos deterministas.

### Calidad

- Cobertura de codigo >= 80% para todo codigo nuevo.
- 0 errores de linter en `src/` via Ultracite.
- TypeScript en modo strict.
- Prohibido `any`; usar `unknown` cuando el tipo es desconocido.

### Seguridad

- Tokens de API almacenados solo en variables de entorno.
- Nunca se loguean ni retornan tokens en respuestas.
- Validacion estricta de entrada via Zod antes de cualquier llamada a API.

---

## 10. Arquitectura Propuesta

### Diagrama de capas

```
+---------------------+
|   LLM / Cliente MCP |
+----------+----------+
           |
           v
+---------------------+     +---------------------+
|   Capa 1: Tools     |     |   Zod Validation    |
|   (7 herramientas)  |<----+   (schemas + infer)   |
+----------+----------+     +---------------------+
           |
           v
+---------------------+
|   Capa 2: Services  |
|   (logica negocio)  |
+----------+----------+
           |
           v
+---------------------+
|   Capa 3: Adapters  |
|   (mapeo API)       |
+----------+----------+
           |
           v
+---------------------+
|   Capa 4: API Client|
|   (Bun.fetch + auth)|
+----------+----------+
           |
           v
+---------------------+
|   Tiendanube API v1 |
+---------------------+
```

### Reglas de importacion

```
tools/     → services/, domain/
services/  → adapters/, domain/
adapters/  → domain/
domain/    → (sin dependencias externas)
config/    → (sin dependencias externas, lee process.env)
```

**Restriccion**: ninguna capa puede importar desde una capa superior. `domain/` no tiene dependencias y es importado por todas las demas capas.

### Componentes principales

| Componente       | Archivo(s)                           | Responsabilidad                                       |
| ---------------- | ------------------------------------ | ----------------------------------------------------- |
| Herramientas MCP | `src/tools/*.ts`                     | Definir schema Zod, metadata xmcp, handler            |
| Servicios        | `src/services/*.ts`                  | Orquestar logica de negocio, manejar errores          |
| Adaptadores      | `src/adapters/*.ts`                  | Transformar entre respuestas API y objetos de dominio |
| Cliente HTTP     | `src/adapters/tiendanube.adapter.ts` | Bun.fetch con auth, retry, timeout                    |
| Modelos          | `src/domain/models/*.ts`             | Tipos TypeScript + schemas Zod                        |
| Errores          | `src/domain/errors.ts`               | Jerarquia de errores de dominio                       |
| Config           | `src/config/env.ts`                  | Carga tipada de variables de entorno                  |

---

## 11. Integracion con Tiendanube

### API Base

- **Version**: v1
- **Base URL**: `https://api.tiendanube.com/v1/{store_id}` o `https://api.nuvemshop.com.br/v1/{store_id}`
- **Formato**: JSON
- **Autenticacion**: Bearer token (`Authorization: Bearer {access_token}`)
- **User-Agent requerido**: `mcp-tiendanube (https://github.com/tiendanube)`

### Endpoints utilizados

| Herramienta              | Metodo HTTP | Endpoint                                                  |
| ------------------------ | ----------- | --------------------------------------------------------- |
| list-products            | GET         | `/products?page={p}&per_page={n}&search={q}&stock={0\|1}` |
| get-product              | GET         | `/products/{id}`                                          |
| update-products          | PUT         | `/products/{id}`                                          |
| manage-variants (create) | POST        | `/products/{id}/variants`                                 |
| manage-variants (update) | PUT         | `/products/{product_id}/variants/{variant_id}`            |
| manage-variants (delete) | DELETE      | `/products/{product_id}/variants/{variant_id}`            |
| manage-images (add)      | POST        | `/products/{id}/images`                                   |
| manage-images (reorder)  | PUT         | `/products/{product_id}/images/{image_id}`                |
| manage-images (remove)   | DELETE      | `/products/{product_id}/images/{image_id}`                |
| update-stock             | PUT         | `/products/{product_id}/variants/{variant_id}`            |
| delete-product           | DELETE      | `/products/{id}`                                          |

### Normalizacion de respuestas

El adaptador de producto (`src/adapters/product.adapter.ts`) transforma la respuesta anidada de Tiendanube en objetos planos:

```typescript
// API response (Tiendanube)
{
  id: 123,
  name: "Zapatilla",
  variants: [{ id: 456, sku: "SKU", price: "10.00", stock: 5 }],
  images: [{ id: 789, src: "https://...", position: 1 }]
}

// Domain object (mcp-tiendanube)
{
  id: "123",           // branded ProductId
  name: "Zapatilla",
  variants: [{ id: "456", sku: "SKU", price: "10.00", stock: 5 }],
  images: [{ id: "789", src: "https://...", position: 1 }]
}
```

---

## 12. Flujo de Autenticacion

### Actual (MVP — Fase 1)

```
1. Usuario configura variables de entorno:
   TIENDANUBE_ACCESS_TOKEN=<token>
   TIENDANUBE_STORE_ID=<store_id>
   TIENDANUBE_API_BASE_URL=https://api.tiendanube.com/v1

2. src/config/env.ts valida y carga la configuracion
   al iniciar el servidor (lazy singleton).

3. src/adapters/tiendanube.adapter.ts inyecta el token
   en el header Authorization: Bearer <token>.

4. Todas las herramientas usan el mismo token y store_id
   para toda la vida del proceso.
```

**Limitaciones del enfoque actual**:

- Un solo token por instancia de servidor.
- No hay rotacion automatica de tokens.
- Si el token expira, el servidor debe reiniciarse con nuevo token.

### Futuro (Fase 2+)

```
1. Usuario registra app en Tiendanube Developer Portal.
2. Obtiene CLIENT_ID y CLIENT_SECRET.
3. Configura redirect URI (ej. https://mcp-server/auth/callback).
4. LLM llama herramienta authenticate-store con credenciales.
5. Servidor redirige a Tiendanube OAuth /apps/authorize.
6. Usuario autoriza la app en el navegador.
7. Tiendanube redirige con authorization code.
8. Servidor intercambia code por access_token.
9. Token se almacena de forma segura (cifrado local).
10. Requests subsiguientes usan token almacenado.
```

---

## 13. Diseno de Herramientas MCP

Todas las herramientas siguen el patron xmcp: `schema` (Zod) + `metadata` (ToolMetadata) + handler (default export).

### list-products

**Schema Zod**:

```typescript
export const schema = {
  page: z.coerce.number().int().min(1).default(1).describe("Page number"),
  search: z.string().optional().describe("Search by product name"),
  stock_status: z
    .enum(["all", "in_stock", "out_of_stock"])
    .default("all")
    .describe("Filter by stock availability"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "list-products",
  description:
    "List products from the store with optional filters. Returns paginated results with up to 50 products per page.",
  annotations: {
    title: "List Products",
    readOnlyHint: true,
    idempotentHint: true,
    destructiveHint: false,
  },
};
```

**Flujo del handler**:

1. Recibe parametros validados por Zod.
2. Llama a `ProductService.list({ page, per_page: 50, search, stock_status })`.
3. Retorna `{ products, pagination }`.

### get-product

**Schema Zod**:

```typescript
export const schema = {
  id: ProductIdSchema.describe("The unique product ID from Tiendanube"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "get-product",
  description:
    "Get complete product details including all variants and images. Returns the full product resource tree.",
  annotations: {
    title: "Get Product Details",
    readOnlyHint: true,
    idempotentHint: true,
    destructiveHint: false,
  },
};
```

**Flujo del handler**:

1. Valida `id` como `ProductId` (branded type).
2. Llama a `ProductService.get(id)`.
3. Si `NotFoundError`, lanza mensaje amigable.
4. Retorna `{ product }`.

### update-products

**Schema Zod**:

```typescript
export const schema = {
  updates: z
    .array(
      z.object({
        id: ProductIdSchema,
        updates: ProductUpdateSchema, // partial Product
      })
    )
    .min(1)
    .describe("Array of product updates to apply"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "update-products",
  description:
    "Bulk update product attributes. Each update specifies a product ID and the fields to change. Valid items are processed even if some items fail validation.",
  annotations: {
    title: "Update Products",
    readOnlyHint: false,
    idempotentHint: false,
    destructiveHint: false,
  },
};
```

**Flujo del handler**:

1. Valida array de updates (min 1 elemento).
2. Llama a `ProductService.updateBulk(updates)`.
3. Cada item se procesa individualmente; fallos no abortan el batch.
4. Retorna `{ results, summary: { total, success, failed } }`.

### manage-variants

**Schema Zod**:

```typescript
export const schema = {
  action: z
    .enum(["create", "update", "delete"])
    .describe("The action to perform on the variant"),
  product_id: ProductIdSchema.describe("The product ID"),
  variant: VariantInputSchema.optional().describe(
    "Variant data for create/update actions"
  ),
  variant_id: z
    .string()
    .optional()
    .describe("The variant ID for update/delete actions"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "manage-variants",
  description:
    "Create, update, or delete variants within a product. For create: provide product_id and variant data. For update: provide variant_id and updated fields. For delete: provide variant_id.",
  annotations: {
    title: "Manage Product Variants",
    readOnlyHint: false,
    idempotentHint: false,
    destructiveHint: true,
  },
};
```

**Flujo del handler**:

1. Valida parametros.
2. Dispatch por `action`:
   - `create`: llama `VariantService.create(product_id, variant)`.
   - `update`: llama `VariantService.update(variant_id, variant)`.
   - `delete`: llama `VariantService.delete(variant_id)`.
3. Retorna resultado especifico por accion.

### manage-images

**Schema Zod**:

```typescript
export const schema = {
  action: z
    .enum(["add", "remove", "reorder"])
    .describe("The action to perform"),
  product_id: ProductIdSchema.describe("The product ID"),
  image_url: z.string().url().optional().describe("Image URL for add action"),
  image_id: z
    .string()
    .optional()
    .describe("Image ID for remove/reorder actions"),
  position: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Position for reorder action"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "manage-images",
  description:
    "Add, remove, or reorder product images. Add requires image_url. Remove requires image_id. Reorder requires image_id and position.",
  annotations: {
    title: "Manage Product Images",
    readOnlyHint: false,
    idempotentHint: false,
    destructiveHint: true,
  },
};
```

**Flujo del handler**:

1. Dispatch por `action`:
   - `add`: llama `ImageService.add(product_id, image_url)`.
   - `remove`: llama `ImageService.remove(image_id)`.
   - `reorder`: llama `ImageService.reorder(image_id, position)`.

### update-stock

**Schema Zod**:

```typescript
export const schema = {
  variant_stock: z
    .array(
      z.object({
        variant_id: z.string().describe("The variant ID"),
        stock: z
          .number()
          .int()
          .min(0)
          .describe("New stock level (must be >= 0)"),
      })
    )
    .min(1)
    .describe("Array of stock level updates for variants"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "update-stock",
  description:
    "Update stock levels for one or more variants in a single operation. Validates that stock values are non-negative before applying.",
  annotations: {
    title: "Update Stock Levels",
    readOnlyHint: false,
    idempotentHint: false,
    destructiveHint: false,
  },
};
```

**Flujo del handler**:

1. Valida que todos los stocks sean >= 0.
2. Llama a `StockService.updateStock(variant_stock)`.
3. Procesa cada variante individualmente.
4. Retorna `{ results, summary }`.

### delete-product

**Schema Zod**:

```typescript
export const schema = {
  product_id: ProductIdSchema.describe("The product ID to delete"),
  confirm: z.boolean().describe("Must be true to confirm deletion"),
};
```

**Metadata**:

```typescript
export const metadata: ToolMetadata = {
  name: "delete-product",
  description:
    "Delete a product from the store. Requires confirm: true to prevent accidental deletions. This action is destructive and cannot be undone.",
  annotations: {
    title: "Delete Product",
    readOnlyHint: false,
    idempotentHint: false,
    destructiveHint: true,
  },
};
```

**Flujo del handler**:

1. Si `confirm !== true`, retorna error amigable sin llamar a API.
2. Si `confirm === true`, llama `ProductService.delete(product_id, true)`.
3. Retorna `{ deleted: product_id, success: true }`.

---

## 14. Estrategia de Escalabilidad

### Escalabilidad horizontal

El servidor MCP es stateless. Cada instancia es independiente y puede escalarse horizontalmente agregando mas procesos detras de un balanceador de carga. No existe sesion de usuario ni estado compartido entre requests.

### Escalabilidad funcional

La arquitectura de 4 capas permite agregar nuevos dominios sin modificar los existentes:

```
Nuevo dominio (ej. Ordenes):
1. Crear modelos en src/domain/models/order.ts
2. Crear adaptador en src/adapters/order.adapter.ts
3. Crear servicio en src/services/order.service.ts
4. Crear herramientas en src/tools/list-orders.ts, src/tools/get-order.ts, etc.
```

Las capas inferiores no se ven afectadas. Los modelos de dominio nuevos no tienen dependencias con los existentes.

### Escalabilidad de datos

- No hay base de datos local. Todos los datos viven en Tiendanube.
- Cache (Fase 2+) debe ser invalidable y con TTL corto para evitar stale data.
- Para multi-tenant (Fase 6), cada tenant requiere aislamiento de tokens y posiblemente cache separada.

---

## 15. Riesgos Tecnicos

| Riesgo                                | Probabilidad | Impacto | Mitigacion                                                                               |
| ------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------------------------- |
| Tiendanube cambia API v1 sin aviso    | Media        | Alto    | Capa de adaptadores aislada; versionado en nombres de archivo (`product.adapter.v1.ts`)  |
| Rate limits agresivos no documentados | Media        | Medio   | Backoff exponencial implementado; rate limiting client-side en Fase 2                    |
| Documentacion de API incompleta       | Alta         | Medio   | Reverse engineering via pruebas manuales; documentar comportamientos observados en tests |
| Tiempo de respuesta de API variable   | Alta         | Medio   | Timeout de 30s; mensajes claros al LLM sobre indisponibilidad temporal                   |
| LLM genera updates bulk destructivos  | Baja         | Alto    | Mecanismo `confirm` en `delete-product`; validacion Zod estricta; scopes OAuth en Fase 2 |
| Errores de build por branded types    | Media        | Bajo    | Documentado como known issue; no afecta runtime                                          |
| Scope creep hacia ordenes/clientes    | Alta         | Medio   | Roadmap explicito con fases definidas; PRs separados por dominio                         |

---

## 16. Metricas de Exito

| Metrica                         | Valor actual       | Objetivo | Estado        |
| ------------------------------- | ------------------ | -------- | ------------- |
| Cobertura de lineas             | 91.02%             | >=80%    | Cumplido      |
| Cobertura de funciones          | 89.69%             | >=80%    | Cumplido      |
| Tests pasando                   | 76/76              | 100%     | Cumplido      |
| Errores de linter               | 0                  | 0        | Cumplido      |
| Build exitoso                   | Si                 | Si       | Cumplido      |
| Tiempo de build                 | <5s                | <10s     | Cumplido      |
| Latencia promedio (lectura)     | Dependiente de API | <2s      | En evaluacion |
| Tasa de errores de API mapeados | 100%               | 100%     | Cumplido      |
| Herramientas MCP funcionales    | 7/7                | 7/7      | Cumplido      |

---

## 17. Roadmap Futuro

| Fase | Nombre                                        | Entregables principales                                                                         | Complejidad |
| ---- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------- |
| 2    | Mejoras Intermedias                           | OAuth, rate limiting client-side, cache, webhooks, upload directo de imagenes, paralelismo bulk | Media-Alta  |
| 3    | Escalabilidad — Ordenes                       | list-orders, get-order, update-order-status, fulfill-order, cancel-order                        | Alta        |
| 4    | Escalabilidad — Clientes                      | list-customers, get-customer, update-customer, search-customers, segments                       | Media       |
| 5    | Escalabilidad — Categorias y Automatizaciones | Gestion de categorias, handlers de webhooks, motor de reglas simple                             | Alta        |
| 6    | Multi-tenant y Enterprise                     | Soporte multi-tienda, dashboard de metricas, observabilidad avanzada, rate limiting por tenant  | Muy Alta    |

Ver `ROADMAP_TECNICO.md` para detalles completos de cada fase.

---

## 18. Consideraciones de Seguridad

### Manejo de tokens

- El token de acceso se lee exclusivamente de la variable de entorno `TIENDANUBE_ACCESS_TOKEN`.
- El token nunca se incluye en respuestas de herramientas MCP.
- El token nunca se loguea, ni siquiera en modo debug.
- El token se inyecta en el header `Authorization` por el adaptador HTTP y no se propaga a capas superiores.

### Validacion de entrada

- Todas las entradas de herramientas pasan por schemas Zod v4 antes de cualquier logica de negocio.
- Tipos de marca (`ProductId`, `VariantId`, `ImageId`) evitan que IDs de diferentes recursos se mezclen en tiempo de compilacion.
- No se usa `eval()`, `Function()`, ni `dangerouslySetInnerHTML`.

### Prevencion de operaciones destructivas accidentales

- `delete-product` requiere `confirm: true` explicito; sin confirmacion retorna error sin tocar la API.
- `manage-variants` y `manage-images` tienen `destructiveHint: true` en su metadata xmcp para que el LLM sea consciente del riesgo.

### Logs

- Los logs de entrada a herramientas registran parametros pero nunca tokens ni datos personales.
- Los logs de error de API registran el cuerpo de respuesta completo a nivel ERROR (excluyendo tokens).

---

## 19. Estrategia de Testing

### Filosofia

TDD estricto: un comportamiento → un test → implementacion minima → refactor. No se mockean colaboradores internos; solo se mockea `Bun.fetch` en tests de adaptador.

### Niveles de test

| Nivel       | Que se testea                                    | Como                                             | Archivos                                                                          |
| ----------- | ------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Dominio     | Schemas Zod parsean input valido/invalido        | Unit tests con expect                            | `src/domain/models/product.test.ts`, `src/domain/errors.test.ts`                  |
| Config      | Carga de variables de entorno                    | Unit tests con process.env mock                  | `src/config/env.test.ts`                                                          |
| Adaptador   | Mapeo HTTP → objeto de dominio                   | Mock de Bun.fetch                                | `src/adapters/tiendanube.adapter.test.ts`, `src/adapters/product.adapter.test.ts` |
| Servicio    | Logica de negocio, manejo de errores, paginacion | Tests de integracion via interfaz publica        | Tests implicitos en tool tests                                                    |
| Herramienta | Validacion de schema, orquestacion de servicio   | Tests de unidad llamando al handler directamente | `src/tools/*.test.ts`                                                             |

### Cobertura

- Gate de CI: >=80% de cobertura para todo codigo nuevo.
- Metrica actual: 91.02% lineas, 89.69% funciones.

### Ejecucion

```bash
bun test              # ejecuta todos los tests
bun test --coverage   # ejecuta con reporte de cobertura
bun x ultracite check # verifica linting
bun run build         # verifica build exitoso
```

---

## 20. Decisiones Tecnicas Justificadas

### 20.1 Bun.fetch como cliente HTTP

**Decision**: Usar `Bun.fetch` nativo con un wrapper ligero en lugar de `axios`, `undici` u otra libreria.

**Justificacion**:

- Zero dependencias adicionales.
- Nativo de Bun, optimizado para el runtime del proyecto.
- Suficiente para llamadas REST simples con retry y timeout.
- `AbortController` soportado nativamente para timeouts.

**Contra**: Menos features que axios (intercepciones, transformacion automatica). Mitigado con la capa de adaptador.

### 20.2 Zod v4 para validacion

**Decision**: Usar Zod v4 (recien lanzado) en lugar de Zod v3.

**Justificacion**:

- Mejoras de performance en parsing de arrays y objetos grandes.
- API de branded types mas limpia (`z.string().brand<"Id">()`).
- Compatibilidad confirmada con xmcp 0.6.10.

**Contra**: Version muy nueva, posibles bugs no descubiertos. Mitigado con tests exhaustivos.

### 20.3 Arquitectura de 4 capas

**Decision**: Separar en `tools → services → adapters → API client` con reglas de importacion estrictas.

**Justificacion**:

- Permite testear cada capa de forma aislada.
- Facilita el cambio de API (si Tiendanube lanza v2, solo cambian adaptadores).
- Evita que logica de negocio se mezcle con logica HTTP o con schemas de herramientas.

**Contra**: Mayor cantidad de archivos y boilerplate. Mitigado con generadores de codigo futuros.

### 20.4 Branded types para IDs

**Decision**: Usar `type ProductId = string & { readonly __brand: "ProductId" }` via Zod.

**Justificacion**:

- Previene en tiempo de compilacion pasar un `variantId` donde se espera un `productId`.
- Aumenta la confianza en refactors a gran escala.
- Costo de implementacion casi nulo con Zod v4.

**Contra**: Requiere `ProductIdSchema.parse(String(id))` en adaptadores. Error de build en tests (documentado como known issue).

### 20.5 Sin autenticacion en el MVP

**Decision**: Usar token estatico de entorno en lugar de implementar OAuth 2.0 desde el inicio.

**Justificacion**:

- Reduce el scope del MVP a la logica de producto.
- OAuth requiere infraestructura de redireccion HTTPS y persistencia de tokens.
- El token estatico es suficiente para un despliegue single-tenant controlado.

**Contra**: No escalable a multi-usuario. Mitigado: OAuth es la primera funcionalidad de la Fase 2.

### 20.6 Herramientas orientadas a tareas

**Decision**: Nombres como `update-stock` y `manage-variants` en lugar de `PUT /variants/{id}`.

**Justificacion**:

- Reduce la carga cognitiva del LLM al seleccionar herramientas.
- Sigue las mejores practicas del protocolo MCP y del skill `mcp-server-design`.
- Permite agrupar operaciones relacionadas (create/update/delete) en una sola herramienta.

**Contra**: Mayor complejidad interna en el handler (switch por accion). Mitigado con handlers pequenos y claros.

### 20.7 Co-ubicacion de tests

**Decision**: `src/tools/list-products.test.ts` junto a `src/tools/list-products.ts`.

**Justificacion**:

- Relacion inmediata entre implementacion y test.
- Facilita navegacion en el editor.
- Convecion establecida en el proyecto (existia `greet.test.ts`).

**Contra**: Build de xmcp incluye archivos `.test.ts` en type-checking, causando errores con branded types. Mitigado: es un known issue no bloqueante.
