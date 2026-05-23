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
  },
};

export default config;
