import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    prompts: "./src/prompts",
    resources: "./src/resources",
    tools: "./src/tools",
  },
  template: {
    icons: [{ src: "./xmcp.svg" }],
    name: "TiendaNube MCP",
    description:
      "MCP para gestionar productos, stock, variantes e imágenes en Tiendanube / Nuvemshop.",
    homePage: "src/home.html",
    instructions:
      "Este servidor requiere credenciales de Tiendanube por headers HTTP del cliente: X-Tiendanube-Access-Token y X-Tiendanube-Store-Id (opcional X-Tiendanube-Api-Base-Url). " +
      "No pedir al usuario el token en parámetros de herramientas. " +
      "Usar list-products con paginación antes de operaciones masivas. " +
      "delete-product requiere confirm: true.",
  },
};

export default config;
