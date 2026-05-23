# Tiendanube / Nuvemshop MCP Server

[![es](https://img.shields.io/badge/lang-es-red.svg)](README.es.md)

An implementation of the **Model Context Protocol (MCP)** server for **Tiendanube** (also known as Nuvemshop in Brazil). This server allows AI models (like Claude, Gemini, ChatGPT) to programmatically manage a Tiendanube store's products, stock, variants, and images.

Built with [Bun](https://bun.sh/) and the [xmcp](https://github.com/basementstudio/xmcp) framework.

---

## 🛠️ Features (MCP Tools)

This server exposes **8 tools** to manage the store's inventory:

| Tool Name         | Description                            | Key Capabilities                                     |
| :---------------- | :------------------------------------- | :--------------------------------------------------- |
| `list-products`   | Retrieve a paginated list of products. | Filters by status, search queries, pagination.       |
| `get-product`     | Get full product details.              | Retrieves nested images, variants, attributes by ID. |
| `create-product`  | Create a new product atomically.       | Creates product, variants, and images in one step.   |
| `update-products` | Batch update multiple products.        | Modifies name, description, price, stock, SKU.       |
| `delete-product`  | Delete a product by ID.                | Safe deletion with confirmation guard.               |
| `update-stock`    | Batch update variant stock levels.     | Updates inventory counts across multiple variants.   |
| `manage-variants` | Manage product variations.             | Create, update, or delete individual variants.       |
| `manage-images`   | Manage product gallery images.         | Add via URL, remove, or reorder images.              |

---

## ⚙️ Configuration & Variables

### 1. Environment Variables

Create a `.env` file in the root of the project:

| Variable                  | Description                     | Required | Example           |
| :------------------------ | :------------------------------ | :------: | :---------------- |
| `TIENDANUBE_STORE_ID`     | Your unique Tiendanube Store ID |   Yes    | `1234567`         |
| `TIENDANUBE_ACCESS_TOKEN` | API Access Token                |   Yes    | `shpat_abc123...` |

### 2. Integration with AI Tools

To connect this server to any AI client (like Cursor, Claude Desktop, or OpenCode) via a remote HTTP connection, add the following configuration:

```json
"mcp-tiendanube": {
  "command": ["npx", "-y", "mcp-remote", "http://127.0.0.1:3001/mcp"],
  "type": "local"
}
```

---

## 🚀 Running & Testing

### Development

Start the development server:

```bash
bun run dev
```

This starts the server on `http://127.0.0.1:3001/mcp`.

### Testing

You can inspect and test the tools interactively using the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector http://127.0.0.1:3001/mcp
```

Or run the unit tests:

```bash
bun test
```

---

## 🛠️ Code Maintenance

| Command         | Action                                                                                                                                                            |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run check` | Run linter and formatter checks ([Ultracite](https://github.com/IvanTsxx/mcp-tiendanube/blob/main/c:/Dev/works/mcp-tiendanube/.agents/skills/ultracite/SKILL.md)) |
| `bun run fix`   | Auto-fix all linter and formatting issues                                                                                                                         |
