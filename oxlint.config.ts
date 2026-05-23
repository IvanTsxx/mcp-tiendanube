import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  rules: {
    "max-classes-per-file": "off",
    "no-unused-vars": "off",
    "func-style": "off",
    "require-await": "off",
    "no-inline-comments": "off",
    "sort-keys": "off",
    "prefer-destructuring": "off",
    "no-invalid-void-type": "off",
    "prefer-template": "off",
    "no-explicit-any": "off",
    "no-promise-executor-return": "off",
    "prefer-module": "off",
    "global-require": "off",
    "require-unicode-regexp": "off",
    "promise/avoid-new": "off",
  },
});
