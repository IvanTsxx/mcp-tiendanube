# Changelog

Todos los cambios notables de este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-05-23

### Added

- Implementacion del MVP de productos con 7 herramientas MCP:
  - `list-products` — listado paginado de productos con filtros por estado de stock y busqueda por nombre.
  - `get-product` — obtencion de detalle completo de producto incluyendo variantes e imagenes.
  - `update-products` — actualizacion masiva de atributos de producto (precio, nombre, descripcion, etc.).
  - `manage-variants` — creacion, actualizacion y eliminacion de variantes dentro de un producto.
  - `manage-images` — agregar imagenes desde URL, eliminar imagenes y reordenar imagenes de producto.
  - `update-stock` — actualizacion de niveles de stock para multiples variantes en una sola operacion.
  - `delete-product` — eliminacion de producto con mecanismo de confirmacion obligatoria (`confirm: true`).
- Arquitectura de 4 capas estrictas: `tools → services → adapters → API client`.
- Cliente HTTP basado en `Bun.fetch` con autenticacion Bearer, User-Agent, timeout de 30s y backoff exponencial ante HTTP 429.
- Jerarquia de errores de dominio: `TiendaNubeError`, `NotFoundError`, `UnauthorizedError`, `RateLimitError`, `ApiUnavailableError`, `ValidationError`.
- Tipos de marca (`ProductId`, `VariantId`, `ImageId`) para seguridad en tiempo de compilacion.
- Configuracion tipada desde variables de entorno via Zod (`src/config/env.ts`).
- Normalizacion de respuestas API de Tiendanube a objetos de dominio planos en la capa de adaptadores.
- Inyeccion de dependencias via setter para facilitar testing.
- Suite de tests completa: 76 tests en 12 archivos con 91.02% de cobertura de lineas y 89.69% de cobertura de funciones.
- Archivo `.env.example` con las variables requeridas para conexion a Tiendanube.
- Integracion con Ultracite para linting y formateo automatico.
- Hooks de Git via lefthook.

### Changed

- No aplica (version inicial).

### Deprecated

- No aplica (version inicial).

### Removed

- No aplica (version inicial).

### Fixed

- No aplica (version inicial).

### Security

- Tokens de API nunca se incluyen en respuestas de herramientas ni en logs.
- Validacion estricta de entrada via Zod v4 antes de cualquier llamada a la API.
- Operaciones destructivas (`delete-product`, `manage-variants`, `manage-images`) requieren confirmacion explicita o `destructiveHint: true` en metadata MCP.

---

## Notas del release 0.1.0

### Estado de funcionalidades futuras

Las siguientes funcionalidades estan planificadas pero aun no implementadas:

| Funcionalidad                                          | Estado          | Fase planificada |
| ------------------------------------------------------ | --------------- | ---------------- |
| Autenticacion OAuth 2.0                                | No implementado | Fase 2           |
| Rate limiting client-side proactivo                    | No implementado | Fase 2           |
| Cache de respuestas                                    | No implementado | Fase 2           |
| Webhooks de Tiendanube                                 | No implementado | Fase 5           |
| Gestion de ordenes (list, get, update status, fulfill) | No implementado | Fase 3           |
| Gestion de clientes (list, get, update, segments)      | No implementado | Fase 4           |
| Gestion de categorias                                  | No implementado | Fase 5           |
| Motor de automatizaciones simple                       | No implementado | Fase 5           |
| Soporte multi-tenant / multi-tienda                    | No implementado | Fase 6           |
| Dashboard de metricas                                  | No implementado | Fase 6           |
| Upload directo de imagenes (binario)                   | No implementado | Fase 2           |
| Transporte STDIO                                       | No implementado | Post-MVP         |

### Stack tecnico del release

| Componente | Version             |
| ---------- | ------------------- |
| xmcp       | 0.6.10              |
| Zod        | ^4.0.0              |
| Bun        | >=1.3.10            |
| TypeScript | strict mode, ESNext |
| Ultracite  | 7.7.0               |
| oxlint     | ^1.66.0             |
| oxfmt      | ^0.51.0             |
| lefthook   | ^2.1.8              |

### Metricas de calidad

| Metrica                  | Valor  |
| ------------------------ | ------ |
| Tests ejecutados         | 76     |
| Tests fallidos           | 0      |
| Cobertura de lineas      | 91.02% |
| Cobertura de funciones   | 89.69% |
| Errores de linter (src/) | 0      |
| Build exitoso            | Si     |

### Archivos relevantes del release

- `src/tools/list-products.ts`
- `src/tools/get-product.ts`
- `src/tools/update-products.ts`
- `src/tools/manage-variants.ts`
- `src/tools/manage-images.ts`
- `src/tools/update-stock.ts`
- `src/tools/delete-product.ts`
- `src/services/product.service.ts`
- `src/services/variant.service.ts`
- `src/services/image.service.ts`
- `src/services/stock.service.ts`
- `src/adapters/tiendanube.adapter.ts`
- `src/adapters/product.adapter.ts`
- `src/adapters/variant.adapter.ts`
- `src/adapters/image.adapter.ts`
- `src/domain/models/product.ts`
- `src/domain/models/pagination.ts`
- `src/domain/errors.ts`
- `src/config/env.ts`
- `package.json`
- `tsconfig.json`
