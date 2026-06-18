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

### 1. Per-user credentials (recommended for remote deploy)

Each user configures **their own token and store ID** in the MCP client. Credentials travel via **HTTP headers** and are never stored on the server (Vercel does not need `TIENDANUBE_ACCESS_TOKEN` or `TIENDANUBE_STORE_ID`).

| Header                      | Required | Description                              |
| :-------------------------- | :------: | :--------------------------------------- |
| `X-Tiendanube-Access-Token` |   Yes    | Your Tiendanube API access token         |
| `X-Tiendanube-Store-Id`     |   Yes    | Your Tiendanube store ID                 |
| `X-Tiendanube-Api-Base-Url` |    No    | Default: `https://api.tiendanube.com/v1` |

**Cursor / remote MCP client:**

```json
{
  "mcpServers": {
    "tiendanube": {
      "url": "https://mcp-tiendanube.vercel.app/mcp",
      "headers": {
        "X-Tiendanube-Access-Token": "${env:TIENDANUBE_ACCESS_TOKEN}",
        "X-Tiendanube-Store-Id": "${env:TIENDANUBE_STORE_ID}"
      }
    }
  }
}
```

**With `mcp-remote` (workaround for spaces in headers):**

```json
{
  "mcpServers": {
    "tiendanube": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-tiendanube.vercel.app/mcp",
        "--header",
        "X-Tiendanube-Access-Token:${TN_TOKEN}",
        "--header",
        "X-Tiendanube-Store-Id:${TN_STORE_ID}"
      ],
      "env": {
        "TN_TOKEN": "your_access_token",
        "TN_STORE_ID": "1234567"
      }
    }
  }
}
```

> Credentials belong in the **MCP client config**, not in tool parameters. This keeps tokens out of LLM context.

The server reads them via [`xmcp/headers`](https://xmcp.dev/docs/core-concepts/middlewares#accessing-headers) on each request (xmcp's recommended pattern). No custom middleware or Express dependency is required.

**Optional MCP endpoint protection** (who can call your Vercel URL): use xmcp's [`apiKeyAuthMiddleware`](https://xmcp.dev/docs/authentication/api-key) with an `x-api-key` header. That is separate from Tiendanube store credentials.

### 2. Environment variables (local development only)

For `bun run dev` or stdio transport, you can use a local `.env`:

| Variable                  | Description      | Required | Example                         |
| :------------------------ | :--------------- | :------: | :------------------------------ |
| `TIENDANUBE_STORE_ID`     | Your store ID    |  Yes\*   | `1234567`                       |
| `TIENDANUBE_ACCESS_TOKEN` | API access token |  Yes\*   | `abc123...`                     |
| `TIENDANUBE_API_BASE_URL` | API base URL     |    No    | `https://api.tiendanube.com/v1` |

\* Only when not using headers (local mode).

### 3. Integration with AI Tools

To connect this server to any AI client (like Cursor, Claude Desktop, or OpenCode) via a remote HTTP connection, use the header configuration from the section above. Minimal local example:

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
