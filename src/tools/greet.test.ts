import { test, expect } from "bun:test";

import greet from "./greet";

test("greet returns greeting for name", () => {
  const result = greet({ name: "World" });
  expect(result).toBe("Hello, World!!");
});

test("greet handles empty name", () => {
  const result = greet({ name: "" });
  expect(result).toBe("Hello, !!");
});
