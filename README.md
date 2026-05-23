# Tiendanube / Nuvemshop MCP Server

[![es](https://img.shields.io/badge/lang-es-red.svg)](README.es.md)

An implementation of the **Model Context Protocol (MCP)** server for **Tiendanube** (also known as Nuvemshop in Brazil). This server allows AI models (like Claude, Gemini, ChatGPT) to programmatically manage a Tiendanube store's products, stock, variants, and images.

Built with [Bun](https://bun.sh/) and the [xmcp](https://github.com/basementstudio/xmcp) framework.

---

## Features (MCP Tools)

This server exposes **8 tools** to manage the store's inventory:

1. **`list-products`**: Retrieve a paginated list of products with support for status filters, search queries, and pagination.
2. **`get-product`**: Get full product details including nested images, variants, and attribute options by ID.
3. **`create-product`**: Atomically create a new product, including its variants and images in a single call.
4. **`update-products`**: Batch update fields (name, description, price, stock, SKU) for multiple products.
5. **`delete-product`**: Remove a product from the store by ID (requires safety confirmation).
6. **`update-stock`**: Update the stock levels for multiple product variants in a single call.
7. **`manage-variants`**: Create, update, or delete specific product variants (pricing, stock, SKU, attributes).
8. **`manage-images`**: Add new images (via URL), remove existing ones, or reorder the product's image gallery.

---

## Getting Started

### 1. Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### 2. Environment Setup

Create a `.env` file in the root of the project:

```env
TIENDANUBE_STORE_ID="your_store_id"
TIENDANUBE_ACCESS_TOKEN="your_api_access_token"
```

### 3. Installation

Install project dependencies:

```bash
bun install
```

---

## Configuration

To connect this server to your AI environment (e.g., Claude Desktop), add the server config to your configuration file (typically `C:\Users\<username>\AppData\Roaming\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "tiendanube": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "env": {
        "TIENDANUBE_STORE_ID": "your_store_id",
        "TIENDANUBE_ACCESS_TOKEN": "your_api_access_token"
      }
    }
  }
}
```

---

## Development & Maintenance

- **Start in development mode**: `bun run dev`
- **Run the test suite**: `bun test`
- **Verify code style and lint**: `bun run check` (runs [Ultracite](https://github.com/IvanTsxx/mcp-tiendanube/blob/main/c:/Dev/works/mcp-tiendanube/.agents/skills/ultracite/SKILL.md) checks)
- **Auto-fix formatting/linting issues**: `bun run fix`
