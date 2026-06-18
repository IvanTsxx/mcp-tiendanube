# Servidor MCP de Tiendanube / Nuvemshop

[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)

Implementación de un servidor **Model Context Protocol (MCP)** para **Tiendanube** (también conocido como Nuvemshop en Brasil). Este servidor permite a modelos de IA (como Claude, Gemini, ChatGPT) administrar de forma programática los productos, stock, variantes e imágenes de una tienda.

Construido con [Bun](https://bun.sh/) y el framework [xmcp](https://github.com/basementstudio/xmcp).

---

## 🛠️ Funcionalidades (Herramientas MCP)

Este servidor expone **8 herramientas** para gestionar el inventario de la tienda:

| Herramienta       | Descripción                                | Capacidades Clave                                         |
| :---------------- | :----------------------------------------- | :-------------------------------------------------------- |
| `list-products`   | Obtiene una lista paginada de productos.   | Filtrado por estado, búsqueda de texto, paginación.       |
| `get-product`     | Obtiene detalles completos de un producto. | Recupera imágenes, variantes y atributos por ID.          |
| `create-product`  | Crea un producto de manera atómica.        | Crea producto, variantes e imágenes en un solo paso.      |
| `update-products` | Actualiza múltiples productos en lote.     | Modifica nombre, descripción, precio, stock, SKU.         |
| `delete-product`  | Elimina un producto por ID.                | Borrado seguro con confirmación obligatoria.              |
| `update-stock`    | Actualiza stock de variantes en lote.      | Modifica cantidades de inventario de múltiples variantes. |
| `manage-variants` | Administra variantes de productos.         | Crea, actualiza o elimina variantes individuales.         |
| `manage-images`   | Administra imágenes del producto.          | Agrega por URL, elimina o reordena la galería.            |

---

## ⚙️ Configuración y Variables

### 1. Credenciales por usuario (recomendado para deploy remoto)

Cada usuario configura **su propio token y store ID** en el cliente MCP. Las credenciales viajan por **headers HTTP** y nunca se guardan en el servidor (Vercel no necesita `TIENDANUBE_ACCESS_TOKEN` ni `TIENDANUBE_STORE_ID`).

| Header                      | Requerido | Descripción                              |
| :-------------------------- | :-------: | :--------------------------------------- |
| `X-Tiendanube-Access-Token` |    Sí     | Token de acceso a la API de tu tienda    |
| `X-Tiendanube-Store-Id`     |    Sí     | ID de tu tienda Tiendanube               |
| `X-Tiendanube-Api-Base-Url` |    No     | Default: `https://api.tiendanube.com/v1` |

**Cursor / cliente MCP remoto:**

```json
{
  "mcpServers": {
    "tiendanube": {
      "url": "https://tu-mcp.vercel.app/mcp",
      "headers": {
        "X-Tiendanube-Access-Token": "${env:TIENDANUBE_ACCESS_TOKEN}",
        "X-Tiendanube-Store-Id": "${env:TIENDANUBE_STORE_ID}"
      }
    }
  }
}
```

**Con `mcp-remote` (workaround para espacios en headers):**

```json
{
  "mcpServers": {
    "tiendanube": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tu-mcp.vercel.app/mcp",
        "--header",
        "X-Tiendanube-Access-Token:${TN_TOKEN}",
        "--header",
        "X-Tiendanube-Store-Id:${TN_STORE_ID}"
      ],
      "env": {
        "TN_TOKEN": "tu_access_token",
        "TN_STORE_ID": "1234567"
      }
    }
  }
}
```

> Las credenciales van en la **config del cliente MCP**, no en parámetros de las herramientas. Así el LLM nunca ve ni expone tu token.

### 2. Variables de entorno (solo desarrollo local)

Para `bun run dev` o transporte stdio, podés usar un `.env` local:

| Variable                  | Descripción     | Requerido | Ejemplo                         |
| :------------------------ | :-------------- | :-------: | :------------------------------ |
| `TIENDANUBE_STORE_ID`     | ID de tu tienda |   Sí\*    | `1234567`                       |
| `TIENDANUBE_ACCESS_TOKEN` | Token de acceso |   Sí\*    | `abc123...`                     |
| `TIENDANUBE_API_BASE_URL` | URL base API    |    No     | `https://api.tiendanube.com/v1` |

\* Solo si no usás headers (modo local).

### 3. Integración con Clientes de IA

Para conectar este servidor a cualquier cliente de IA (como Cursor, Claude Desktop o OpenCode) mediante conexión HTTP remota, usá la configuración con headers de la sección anterior. Ejemplo mínimo local:

```json
"mcp-tiendanube": {
  "command": ["npx", "-y", "mcp-remote", "http://127.0.0.1:3001/mcp"],
  "type": "local"
}
```

---

## 🚀 Ejecución y Pruebas

### Desarrollo

Inicia el servidor de desarrollo:

```bash
bun run dev
```

Esto levantará el servidor en `http://127.0.0.1:3001/mcp`.

### Pruebas

Podés inspeccionar y probar las herramientas de manera interactiva usando el inspector oficial de MCP:

```bash
npx @modelcontextprotocol/inspector http://127.0.0.1:3001/mcp
```

O correr la suite de pruebas unitarias:

```bash
bun test
```

---

## 🛠️ Mantenimiento de Código

| Comando         | Acción                                                                                                                                                          |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run check` | Corre el linter y formateador ([Ultracite](https://github.com/IvanTsxx/mcp-tiendanube/blob/main/c:/Dev/works/mcp-tiendanube/.agents/skills/ultracite/SKILL.md)) |
| `bun run fix`   | Corrige automáticamente todos los problemas de linter y formato                                                                                                 |
