import type { InferSchema, PromptMetadata } from "xmcp";
import { z } from "zod";

// Define the schema for prompt parameters
export const schema = {
  code: z.string().describe("The code to review"),
};

// Define prompt metadata
export const metadata: PromptMetadata = {
  description: "Review code for best practices and potential issues",
  name: "review-code",
  role: "user",
  title: "Review Code",
};

// Prompt implementation
export default function reviewCode({ code }: InferSchema<typeof schema>) {
  return `Please review this code for:
      - Code quality and best practices
      - Potential bugs or security issues
      - Performance optimizations
      - Readability and maintainability

      Code to review:
      \`\`\`
      ${code}
      \`\`\``;
}
