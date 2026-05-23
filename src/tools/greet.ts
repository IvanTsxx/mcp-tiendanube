import type { ToolMetadata, InferSchema } from "xmcp";
import { z } from "zod";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    readOnlyHint: true,
    title: "Greet the user",
  },
  description: "Greet the user",
  name: "greet",
};

// Tool implementation
export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!!`;
}
