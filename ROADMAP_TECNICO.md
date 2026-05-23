# Roadmap Tecnico — mcp-tiendanube

Servidor MCP (Model Context Protocol) para gestion de catalogos de productos en Tiendanube mediante herramientas orientadas a tareas.

---

## 1. Vision y Objetivo

Construir un servidor MCP que permita a los LLMs gestionar catalogos de productos en Tiendanube sin necesidad de comprender los detalles de la API REST. El servidor actua como puente entre el protocolo MCP (xmcp) y la API v1 de Tiendanube, exponiendo herramientas de alto nivel que reflejan tareas de negocio reales: listar productos, actualizar precios, gestionar variantes, controlar stock, administrar imagenes, etc.

**Objetivo final**: Un servidor MCP robusto, type-safe, testeado y extensible que sirva como capa de abstraccion entre inteligencias artificiales y la plataforma de e-commerce Tiendanube.

---

## 2. Estado Actual

**Fase 1 completada (MVP Productos)** — 100% de las tareas implementadas y verificadas.

| Metrica                    | Valor  | Umbral |
| -------------------------- | ------ | ------ |
| Herramientas implementadas | 7      | 7      |
| Archivos de test           | 12     | —      |
| Tests ejecutados           | 70     | —      |
| Tests fallidos             | 0      | 0      |
| Cobertura de funciones     | 89.69% | >=80%  |
| Cobertura de lineas        | 91.02% | >=80%  |
| Errores de linter (src/)   | 0      | 0      |
| Build exitoso              | Si     | Si     |

### Herramientas entregadas

| Herramienta       | Accion                                    | Endpoints API                  |
| ----------------- | ----------------------------------------- | ------------------------------ |
| `list-products`   | Listado paginado con filtros              | `GET /products`                |
| `get-product`     | Detalle completo con variantes e imagenes | `GET /products/{id}`           |
| `update-products` | Actualizacion masiva de atributos         | `PUT /products/{id}`           |
| `manage-variants` | Crear, actualizar o eliminar variantes    | `POST/PUT/DELETE /products/{product_id}/variants` |
| `manage-images`   | Agregar, eliminar o reordenar imagenes    | `POST/DELETE/PUT /products/{product_id}/images`   |
| `update-stock`    | Actualizar niveles de stock por variante  | `PUT /products/{product_id}/variants/{variant_id}` |
| `delete-product`  | Eliminar producto con confirmacion        | `DELETE /products/{id}`        |

### Arquitectura implementada

```
src/
├── tools/          ← 7 herramientas MCP (xmcp schema + metadata + handler)
├── services/       ← 4 servicios de negocio (Product, Variant, Image, Stock)
├── adapters/       ← 4 adaptadores (TiendanubeApi, Product, Variant, Image)
├── domain/         ← Modelos tipados + schemas Zod + errores
│   ├── models/
│   └── errors.ts
└── config/         ← Configuracion tipada desde variables de entorno
```

### Tecnologias base

- **Runtime**: Bun (>=1.3.10)
- **Framework MCP**: xmcp 0.6.10
- **Validacion**: Zod v4
- **HTTP client**: Bun.fetch nativo
- **Lint/Format**: Ultracite (oxlint + oxfmt)
- **Hooks**: lefthook

---

## 3. Fases Detalladas

### Fase 1: MVP Productos (COMPLETADO)

**Objetivo**: Implementar el ciclo de vida completo de productos mediante 7 herramientas MCP orientadas a tareas.

**Funcionalidades entregadas**:

- Listado paginado de productos con filtros por estado de stock y busqueda por nombre.
- Obtencion de detalle completo de producto incluyendo variantes e imagenes.
- Actualizacion masiva de atributos de productos (nombre, descripcion, precio).
- Gestion de variantes: creacion, actualizacion y eliminacion.
- Gestion de imagenes: agregar desde URL, eliminar y reordenar.
- Actualizacion de stock por variante en batch.
- Eliminacion de productos con mecanismo de confirmacion.

**Arquitectura involucrada**:

- `src/tools/*` — 7 herramientas con schemas Zod y metadata xmcp.
- `src/services/*` — 4 servicios que orquestan logica de negocio.
- `src/adapters/*` — 4 adaptadores que mapean a la API de Tiendanube.
- `src/domain/*` — Modelos de dominio con tipos de marca (branded types) y jerarquia de errores.
- `src/config/env.ts` — Configuracion tipada desde `.env`.

**Endpoints/dominios Tiendanube afectados**:

- `GET /v1/{store_id}/products`
- `GET /v1/{store_id}/products/{id}`
- `PUT /v1/{store_id}/products/{id}`
- `DELETE /v1/{store_id}/products/{id}`
- `POST /v1/{store_id}/products/{id}/variants`
- `PUT /v1/{store_id}/products/{product_id}/variants/{variant_id}`
- `DELETE /v1/{store_id}/products/{product_id}/variants/{variant_id}`
- `POST /v1/{store_id}/products/{id}/images`
- `PUT /v1/{store_id}/products/{product_id}/images/{image_id}`
- `DELETE /v1/{store_id}/products/{product_id}/images/{image_id}`

**Complejidad estimada**: Media

**Riesgos tecnicos mitigados**:

- Cambios en la API v1 de Tiendanube — mitigado mediante capa de adaptadores aislada.
- Rate limiting — mitigado con backoff exponencial (1s, 2s, 4s) con jitter del 10%.
- Tokens expirados — mitigado con mapeo de errores HTTP 401 a mensajes amigables.

**Decisiones recomendadas que ya se aplicaron**:

- Arquitectura de 4 capas con importacion protegida entre capas.
- Bun.fetch como cliente HTTP sin dependencias adicionales.
- Tipos de marca (`ProductId`, `VariantId`, `ImageId`) para seguridad en tiempo de compilacion.
- Co-ubicacion de tests (`*.test.ts` junto a `*.ts`).
- Inyeccion de dependencias via setter para testabilidad.

**Criterios de finalizacion (todos cumplidos)**:

- [x] 70 tests pasan con 0 fallos.
- [x] Cobertura de lineas >=91%.
- [x] `bun run build` genera artefactos sin errores.
- [x] `bun x ultracite check` reporta 0 errores en `src/`.
- [x] Las 7 herramientas responden correctamente a entradas validas.
- [x] Las herramientas retornan mensajes de error amigables ante fallos de la API.

**Dependencias**: xmcp 0.6.10, Zod v4, Bun runtime, API v1 de Tiendanube.

---

### Fase 2: Mejoras Intermedias

**Objetivo**: Consolidar la robustez del servidor con autenticacion OAuth, manejo avanzado de rate limits, cache, webhooks y operaciones bulk optimizadas.

**Funcionalidades**:

- Implementar flujo OAuth 2.0 "Authorization Code" para obtener `access_token` dinamicamente.
- Agregar persistencia de tokens (almacenamiento seguro, rotacion).
- Implementar rate limiting del lado del cliente con ventanas deslizantes (sliding window).
- Agregar cache en memoria para lecturas frecuentes (`get-product`, `list-products`) con invalidacion por TTL.
- Soporte para webhooks de Tiendanube para invalidacion proactiva de cache.
- Operaciones bulk con paralelismo controlado (limitar concurrencia de `update-products` y `update-stock`).
- Carga directa de imagenes (upload binario) ademas de agregar por URL.

**Arquitectura involucrada**:

- Nuevas carpetas: `src/auth/`, `src/cache/`, `src/webhooks/`.
- Modificaciones en `src/adapters/tiendanube.adapter.ts` para rate limiting client-side.
- Modificaciones en `src/services/*` para soporte de cache y paralelismo.
- Extension de `src/config/env.ts` con variables OAuth (`TIENDANUBE_CLIENT_ID`, `TIENDANUBE_CLIENT_SECRET`, `REDIRECT_URI`).

**Endpoints/dominios Tiendanube afectados**:

- Endpoints OAuth de Tiendanube (`/apps/authorize`, `/apps/authorize/token`).
- Webhooks: suscripcion a eventos de producto (`product.created`, `product.updated`, `product.deleted`).
- `POST /v1/{store_id}/products/{id}/images` (para upload binario directo).

**Complejidad estimada**: Media-Alta

**Riesgos tecnicos**:

- Complejidad del flujo OAuth con manejo de estados y CSRF.
- Persistencia de tokens: donde almacenar y como rotar sin perder conexiones activas.
- Cache stale: webhooks pueden fallar o retrasarse, necesitando estrategia de TTL agresiva.
- Concurrencia bulk: Tiendanube puede rechazar demasiadas peticiones simultaneas.

**Decisiones recomendadas**:

- Usar un almacenamiento simple para tokens (SQLite o archivo JSON cifrado local) en lugar de Redis para mantener el servidor stateless y simple.
- Implementar OAuth como un recurso MCP separado (`authenticate-store`) en lugar de proceso automatico, para que el LLM controle el flujo.
- Cache en memoria con `Map` y TTL de 60s para lecturas; desactivar cache para herramientas de escritura.
- Limitar concurrencia bulk a 5 peticiones paralelas usando `Promise.all` con chunking.

**Criterios de finalizacion**:

- [ ] Flujo OAuth completo testeado con tokens de prueba.
- [ ] Rate limit client-side funciona sin generar 429 reales.
- [ ] Cache reduce latencia de `list-products` en >=50% para requests repetidos.
- [ ] Webhooks invalidan cache correctamente.
- [ ] Upload directo de imagenes funciona end-to-end.

**Dependencias**: Fase 1 completada, credenciales de app OAuth de Tiendanube, dominio publico para webhooks.

---

### Fase 3: Escalabilidad — Ordenes

**Objetivo**: Extender el servidor MCP para gestionar ordenes de compra, estados de envio y fulfillment.

**Funcionalidades**:

- `list-orders` — Listado paginado de ordenes con filtros por estado (`paid`, `shipped`, `cancelled`, `pending`).
- `get-order` — Detalle completo de orden incluyendo line items, cliente, direccion de envio y pagos.
- `update-order-status` — Cambiar estado de orden (ej. `pending` → `paid`, `paid` → `shipped`).
- `fulfill-order` — Crear fulfillment con numero de tracking y transportista.
- `cancel-order` — Cancelar orden con razon opcional.

**Arquitectura involucrada**:

- Nuevos modelos de dominio: `Order`, `OrderLineItem`, `ShippingAddress`, `Payment`, `Fulfillment`.
- Nuevos servicios: `OrderService`, `FulfillmentService`.
- Nuevos adaptadores: `OrderAdapter`, `FulfillmentAdapter`.
- Nuevas herramientas: `list-orders.ts`, `get-order.ts`, `update-order-status.ts`, `fulfill-order.ts`, `cancel-order.ts`.

**Endpoints/dominios Tiendanube afectados**:

- `GET /v1/{store_id}/orders`
- `GET /v1/{store_id}/orders/{id}`
- `PUT /v1/{store_id}/orders/{id}`
- `POST /v1/{store_id}/orders/{id}/fulfillments`
- `POST /v1/{store_id}/orders/{id}/cancel`

**Complejidad estimada**: Alta

**Riesgos tecnicos**:

- Estados de orden complejos y dependencias entre transiciones (maquina de estados).
- Datos sensibles de clientes (LGPD/GDPR) — requiere logging cuidadoso.
- Webhooks de ordenes son criticos para sincronizacion.

**Decisiones recomendadas**:

- Implementar una maquina de estados simple para validar transiciones de orden antes de enviar a la API.
- No persistir datos de ordenes localmente; el servidor MCP debe permanecer stateless.
- Logging de accesos a ordenes debe excluir PII (personally identifiable information).

**Criterios de finalizacion**:

- [ ] Todas las herramientas de ordenes tienen tests con >=80% de cobertura.
- [ ] Transiciones de estado invalidas son rechazadas antes de llamar a la API.
- [ ] Fulfillment crea tracking correctamente.

**Dependencias**: Fase 1 completada. Fase 2 recomendada pero no bloqueante.

---

### Fase 4: Escalabilidad — Clientes

**Objetivo**: Gestionar clientes, segmentacion y datos de contacto.

**Funcionalidades**:

- `list-customers` — Listado paginado de clientes con filtros por fecha de registro y total gastado.
- `get-customer` — Perfil completo de cliente incluyendo historial de ordenes.
- `update-customer` — Actualizar datos de contacto, direccion y notas.
- `create-customer-segment` — Crear segmentos de clientes basados en reglas (ej. "gastaron > $500").
- `search-customers` — Busqueda por email, nombre o telefono.

**Arquitectura involucrada**:

- Nuevos modelos: `Customer`, `CustomerSegment`, `Address`.
- Nuevos servicios: `CustomerService`, `SegmentService`.
- Nuevos adaptadores: `CustomerAdapter`.
- Nuevas herramientas en `src/tools/`.

**Endpoints/dominios Tiendanube afectados**:

- `GET /v1/{store_id}/customers`
- `GET /v1/{store_id}/customers/{id}`
- `PUT /v1/{store_id}/customers/{id}`
- `POST /v1/{store_id}/customers`

**Complejidad estimada**: Media

**Riesgos tecnicos**:

- Datos personales sensibles — requiere anonimizacion en logs y manejo LGPD.
- Busqueda por texto libre puede ser lenta si la API no soporta busqueda eficiente.

**Decisiones recomendadas**:

- Aplicar masking a emails y telefonos en todos los logs.
- Implementar `search-customers` como filtro por email exacto primero, ya que Tiendanube no expone busqueda full-text en la API v1 publica.

**Criterios de finalizacion**:

- [ ] CRUD completo de clientes testeado.
- [ ] Segmentos basicos funcionan con reglas simples.
- [ ] Datos sensibles no aparecen en logs ni errores.

**Dependencias**: Fase 1 completada.

---

### Fase 5: Escalabilidad — Categorias y Automatizaciones

**Objetivo**: Gestionar categorias de productos, recibir webhooks y crear reglas de automatizacion.

**Funcionalidades**:

- `list-categories` — Arbol de categorias con jerarquia padre-hijo.
- `create-category` — Crear categoria con nombre, descripcion y categoria padre.
- `update-category` — Modificar atributos de categoria.
- `delete-category` — Eliminar categoria vacia o migrar productos.
- `assign-products-to-category` — Asociar productos a categorias en batch.
- Webhook handlers para eventos: `product.created`, `product.updated`, `product.deleted`, `order.paid`, `order.cancelled`.
- Motor de reglas simple: "Si stock de producto X < 5, enviar alerta" o "Si orden pagada, actualizar stock".

**Arquitectura involucrada**:

- Nuevos modelos: `Category`, `WebhookEvent`, `AutomationRule`.
- Nuevos servicios: `CategoryService`, `WebhookService`, `AutomationEngine`.
- Nuevos adaptadores: `CategoryAdapter`.
- Posible necesidad de cola de eventos (Bun SQLite o in-memory queue).

**Endpoints/dominios Tiendanube afectados**:

- `GET /v1/{store_id}/categories`
- `POST /v1/{store_id}/categories`
- `PUT /v1/{store_id}/categories/{id}`
- `DELETE /v1/{store_id}/categories/{id}`
- Endpoints de suscripcion a webhooks.

**Complejidad estimada**: Alta

**Riesgos tecnicos**:

- Arbol de categorias puede generar bucles o inconsistencias si no se valida el ancestro.
- Motor de reglas simple puede volverse complejo rapidamente; hay que limitar su scope.
- Webhooks requieren endpoint publico HTTPS y verificacion de firma.

**Decisiones recomendadas**:

- Limitar motor de reglas a 5 tipos de triggers y 3 tipos de actions para evitar complejidad excesiva.
- Usar validacion de arbol (detectar ciclos) antes de crear/actualizar categorias.
- Webhooks: verificar firma de payload si Tiendanube lo soporta; de lo contrario, validar IP de origen.

**Criterios de finalizacion**:

- [ ] Arbol de categorias navegable y editable.
- [ ] Webhooks reciben y procesan eventos correctamente.
- [ ] Motor de reglas ejecuta al menos 3 tipos de automatizaciones.

**Dependencias**: Fase 1 completada. Fase 2 recomendada para webhooks.

---

### Fase 6: Multi-tenant y Enterprise

**Objetivo**: Permitir que un unico servidor MCP sirva multiples tiendas con aislamiento completo y observabilidad avanzada.

**Funcionalidades**:

- Multi-store: el servidor puede conectarse a multiples `store_id` con tokens diferentes.
- Contexto por request: el LLM especifica la tienda en cada llamada a herramienta.
- Dashboard de administracion (endpoint HTTP simple) con metricas de uso por tienda.
- Observabilidad avanzada: tracing de requests, metricas de latencia por endpoint, conteo de errores.
- Rate limiting por tienda (no global).
- Autenticacion de API key para acceso al dashboard.

**Arquitectura involucrada**:

- Refactor de `src/config/env.ts` para soportar configuracion dinamica por tienda.
- Nuevo middleware de contexto: `src/middleware/tenant-context.ts`.
- Nuevo modulo de observabilidad: `src/observability/` (metrics, tracing).
- Posible necesidad de base de datos ligera (SQLite) para persistir configuraciones de tiendas.

**Endpoints/dominios Tiendanube afectados**:

- Todos los existentes, pero con `store_id` y token dinamicos por request.

**Complejidad estimada**: Muy Alta

**Riesgos tecnicos**:

- Aislamiento de datos entre tiendas: error critico si se mezclan tokens o cache.
- Escalabilidad del servidor MCP con muchas tiendas concurrentes.
- Complejidad operativa: monitoreo, alerting, backups de configuracion.

**Decisiones recomendadas**:

- Implementar aislamiento via `AsyncLocalStorage` (Bun/Node) para contexto de tienda por request.
- Usar SQLite para configuracion de tiendas; datos operativos siguen en Tiendanube.
- Dashboard como recurso MCP estatico o endpoint HTTP separado; no como herramienta MCP.

**Criterios de finalizacion**:

- [ ] Servidor sirve >=3 tiendas simultaneamente sin mezcla de datos.
- [ ] Dashboard muestra metricas en tiempo real.
- [ ] Rate limiting funciona por tienda individualmente.

**Dependencias**: Fases 1-5 completadas. Fase 2 (OAuth) es bloqueante para multi-tenant real.

---

## 4. Recomendaciones Transversales

### Estructura de carpetas

Mantener la estructura actual y extender siguiendo las mismas convenciones:

```
src/
├── tools/          ← Una herramienta por archivo. Co-ubicar test.
├── services/       ← Un servicio por dominio. Sin logica HTTP.
├── adapters/       ← Un adaptador por recurso API + cliente HTTP base.
├── domain/         ← Modelos puros, sin dependencias externas.
│   ├── models/
│   └── errors.ts
├── config/         ← Configuracion tipada, singleton lazy-loaded.
├── auth/           ← (Fase 2+) Flujos OAuth, token rotation.
├── cache/          ← (Fase 2+) Implementacion de cache con TTL.
├── webhooks/       ← (Fase 5+) Handlers de eventos entrantes.
└── observability/  ← (Fase 6+) Metrics, tracing, logging estructurado.
```

### Diseno de herramientas MCP

- **Nombrado orientado a tareas**: `update-stock`, no `put-variant-stock`.
- **Descripciones ricas**: explicar que hace, cuando usarlo, y que retorna.
- **Anotaciones semanticas**: usar `readOnlyHint`, `destructiveHint`, `idempotentHint` correctamente.
- **Schemas Zod explicitos**: todos los parametros deben tener `.describe()`.
- **Operaciones bulk donde reduzcan round-trips**: `update-products` y `update-stock` son el patron correcto.

### Autenticacion

- **Fase 1**: Token estatico por variable de entorno. Aceptable para MVP.
- **Fase 2+**: Implementar OAuth 2.0 "Authorization Code".
- **Nunca** almacenar tokens en el codigo fuente.
- **Nunca** incluir tokens en respuestas de herramientas o mensajes de error.

### Rate limiting

- **Actual**: Backoff exponencial reactivo ante HTTP 429 (1s, 2s, 4s + jitter 10%).
- **Fase 2+**: Agregar rate limiting proactivo del lado del cliente para prevenir 429.
- **Fase 6+**: Rate limiting por tenant, no global.

### Manejo de errores

- Jerarquia de errores existente:
  - `TiendaNubeError` (base)
  - `NotFoundError` (404)
  - `UnauthorizedError` (401)
  - `RateLimitError` (429)
  - `ApiUnavailableError` (503)
  - `ValidationError` (Zod)
- **Regla**: las herramientas MCP nunca deben exponer codigos HTTP crudos al LLM.
- **Regla**: los mensajes deben ser accionables: "Producto no encontrado (ID: 123)" en lugar de "404 Not Found".

### Tipado y validacion

- Usar `z.string().brand<"TypeId">()` para todos los IDs de recursos externos.
- Exportar tanto schemas Zod como tipos inferidos (`z.infer<>`).
- Funciones con tipos explicitos para parametros y retornos.
- Prohibido `any`; usar `unknown` si el tipo es realmente desconocido.

### Logging

- **Nivel INFO**: entrada a herramienta (parametros, excluyendo tokens).
- **Nivel ERROR**: errores de API con cuerpo completo de respuesta.
- **Nunca** loguear `TIENDANUBE_ACCESS_TOKEN` ni datos personales (PII).
- Usar logging estructurado (JSON) en Fase 6+ para observabilidad.

### Testing

- TDD obligatorio: un comportamiento → un test → implementacion minima.
- Un archivo de test por modulo, co-ubicado.
- Solo mockear `Bun.fetch` en tests de adaptador.
- No mockear colaboradores internos (servicios, herramientas).
- Cobertura minima: 80% para todo codigo nuevo.

### Versionado y despliegue

- Usar versionado semver (`0.1.0`, `0.2.0`, etc.).
- Taggear releases en Git.
- El build genera `dist/http.js` via `xmcp build`.
- Servidor stateless: no requiere migraciones de base de datos.

### Escalabilidad

- El servidor es stateless; escala horizontalmente agregando instancias.
- Cache en memoria (Fase 2+) invalida la pureza stateless pero es aceptable para lecturas.
- Para multi-tenant real (Fase 6), considerar separacion de tokens y rate limits por instancia.
