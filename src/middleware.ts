import type { Middleware } from "xmcp";

import {
  CredentialsError,
  validateCredentialsOrThrow,
} from "./config/credentials";

const middleware: Middleware = async (req, res, next) => {
  try {
    validateCredentialsOrThrow(req.headers);
    return next();
  } catch (error) {
    if (error instanceof CredentialsError) {
      res.status(401).json({
        error: "Unauthorized",
        hint: "Configure X-Tiendanube-Access-Token and X-Tiendanube-Store-Id in your MCP client headers (or env vars for local stdio).",
        message: error.message,
      });
      return;
    }

    throw error;
  }
};

export default middleware;
