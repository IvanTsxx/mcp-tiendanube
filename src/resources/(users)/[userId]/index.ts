import type { ResourceMetadata, InferSchema } from "xmcp";
import { z } from "zod";

export const schema = {
  userId: z.string().describe("The ID of the user"),
};

export const metadata: ResourceMetadata = {
  description: "User profile information",
  name: "user-profile",
  title: "User Profile",
};

export default function handler({ userId }: InferSchema<typeof schema>) {
  return `Profile data for user ${userId}`;
}
