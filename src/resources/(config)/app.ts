import type { ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  description: "Application configuration data",
  name: "app-config",
  title: "Application Config",
};

export default function handler() {
  return "App configuration here";
}
