# Servidor MCP de Tiendanube / Nuvemshop

[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)

Implementación de un servidor **Model Context Protocol (MCP)** para **Tiendanube** (también conocido como Nuvemshop en Brasil). Este servidor permite a modelos de IA (como Claude, Gemini, ChatGPT) administrar de forma programática los productos, stock, variantes e imágenes de una tienda.

Construido con [Bun](https://bun.sh/) y el framework [xmcp](https://github.com/basementstudio/xmcp).

---

## Funcionalidades (Herramientas MCP)

Este servidor expone **8 herramientas** para gestionar el inventario de la tienda:

1. **`list-products`**: Obtiene una lista paginada de productos con soporte para filtros de estado, búsqueda y paginación.
2. **`get-product`**: Obtiene los detalles completos de un producto por ID, incluyendo imágenes, variantes y opciones de atributos.
3. **`create-product`**: Crea de manera atómica un nuevo producto, incluyendo sus variantes e imágenes en una sola llamada.
4. **`update-products`**: Actualiza campos (nombre, descripción, precio, stock, SKU) de múltiples productos en lote.
5. **`delete-product`**: Elimina un producto de la tienda por su ID (requiere confirmación de seguridad).
6. **`update-stock`**: Actualiza los niveles de stock para múltiples variantes de productos en una sola llamada.
7. **`manage-variants`**: Crea, actualiza o elimina variantes específicas de un producto (precio, stock, SKU, atributos).
8. **`manage-images`**: Agrega nuevas imágenes (vía URL), elimina imágenes existentes o reordena la galería de imágenes del producto.

---

## Introducción

### 1. Requisitos previos

Asegúrate de tener [Bun](https://bun.sh/) instalado en tu sistema.

### 2. Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
TIENDANUBE_STORE_ID="tu_id_de_tienda"
TIENDANUBE_ACCESS_TOKEN="tu_token_de_acceso_api"
```

### 3. Instalación

Instala las dependencias del proyecto:

```bash
bun install
```

---

## Configuración

Para conectar este servidor a tu entorno de IA (por ejemplo, Claude Desktop), agrega la configuración del servidor a tu archivo de configuración (normalmente `C:\Users\<usuario>\AppData\Roaming\Claude\claude_desktop_config.json` en Windows):

```json
{
  "mcpServers": {
    "tiendanube": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "env": {
        "TIENDANUBE_STORE_ID": "tu_id_de_tienda",
        "TIENDANUBE_ACCESS_TOKEN": "tu_token_de_acceso_api"
      }
    }
  }
}
```

---

## Desarrollo y Mantenimiento

- **Iniciar en modo desarrollo**: `bun run dev`
- **Correr la suite de pruebas**: `bun test`
- **Verificar formato y linter**: `bun run check` (corre los análisis de [Ultracite](https://github.com/IvanTsxx/mcp-tiendanube/blob/main/c:/Dev/works/mcp-tiendanube/.agents/skills/ultracite/SKILL.md))
- **Corregir problemas de formato/linter automáticamente**: `bun run fix`
