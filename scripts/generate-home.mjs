#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const xmcpHttpPath = path.join(root, "node_modules/xmcp/dist/runtime/http.js");
const outputPath = path.join(root, "src/home.html");

const SERVER_NAME = "TiendaNube MCP";
const SERVER_DESCRIPTION =
  "MCP para gestionar productos, stock, variantes e imágenes en Tiendanube / Nuvemshop.";

function extractFromXmcpBundle(source) {
  const cssStart = source.indexOf("pE=String.raw`") + "pE=String.raw`".length;
  let cssEnd = cssStart;
  while (source[cssEnd] !== "`") {
    cssEnd += 1;
  }

  const iconsMarker = "p$={";
  const iconsStart = source.indexOf(iconsMarker) + "p$=".length;
  const iconsEnd = source.indexOf("},pE=String.raw");

  return {
    css: source.slice(cssStart, cssEnd),
    icons: source.slice(iconsStart, iconsEnd + 1),
  };
}

function buildCredentialsSection() {
  return `
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Credenciales de tu tienda</h2>
            <p class="body-text">
              Cada usuario envía su propio token y store ID por headers HTTP.
              El servidor en Vercel <strong>no guarda</strong> credenciales de Tiendanube.
            </p>
          </div>
          <table class="credentials-table" aria-label="Headers requeridos">
            <thead>
              <tr>
                <th>Header</th>
                <th>Requerido</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>X-Tiendanube-Access-Token</code></td>
                <td>Sí</td>
                <td>Access token de la API de tu tienda</td>
              </tr>
              <tr>
                <td><code>X-Tiendanube-Store-Id</code></td>
                <td>Sí</td>
                <td>ID de tu tienda (user_id del token OAuth)</td>
              </tr>
              <tr>
                <td><code>X-Tiendanube-Api-Base-Url</code></td>
                <td>No</td>
                <td>Default: <code>https://api.tiendanube.com/v1</code></td>
              </tr>
            </tbody>
          </table>
          <p class="body-text credentials-note">
            En Cursor, <code>\${env:VAR}</code> lee variables del shell del sistema, no del <code>.env</code> del proyecto.
          </p>
        </div>
      </section>`;
}

function buildClientScript(icons) {
  return `
  (() => {
    const elements = {
      name: document.getElementById("server-name"),
      description: document.getElementById("server-description"),
      grid: document.getElementById("connection-grid"),
      remoteSnippet: document.getElementById("remote-snippet"),
      copyRemoteButton: document.getElementById("copy-remote-snippet"),
      copyIcon: document.getElementById("copy-icon"),
      checkIcon: document.getElementById("check-icon"),
      toast: document.getElementById("toast"),
    };

    const resolvedName = ${JSON.stringify(SERVER_NAME)};
    const resolvedDescription = ${JSON.stringify(SERVER_DESCRIPTION)};
    const origin = window.location.origin.replace(/\\/$/, "");
    const serverUrl = origin + "/mcp";
    const identifier =
      resolvedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "tiendanube-mcp";

    if (elements.name) elements.name.textContent = resolvedName;
    if (elements.description) elements.description.textContent = resolvedDescription;

    const icons = ${icons};

    const cursorSnippet = JSON.stringify(
      {
        [identifier]: {
          url: serverUrl,
          headers: {
            "X-Tiendanube-Access-Token": "\${env:TIENDANUBE_ACCESS_TOKEN}",
            "X-Tiendanube-Store-Id": "\${env:TIENDANUBE_STORE_ID}",
          },
        },
      },
      null,
      2
    );

    const mcpRemoteSnippet = JSON.stringify(
      {
        [identifier]: {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            serverUrl,
            "--header",
            "X-Tiendanube-Access-Token:\${TIENDANUBE_ACCESS_TOKEN}",
            "--header",
            "X-Tiendanube-Store-Id:\${TIENDANUBE_STORE_ID}",
          ],
          env: {
            TIENDANUBE_ACCESS_TOKEN: "tu_access_token",
            TIENDANUBE_STORE_ID: "1234567",
          },
        },
      },
      null,
      2
    );

    const connectionOptions = [
      { label: "Cursor", snippet: cursorSnippet, icon: "cursor" },
      {
        label: "Claude Code",
        snippet: \`claude mcp add --transport http "\${identifier}" \\\\\\n    "\${serverUrl}"\`,
        icon: "claude",
      },
      { label: "Claude Desktop", snippet: mcpRemoteSnippet, icon: "claude" },
      { label: "Windsurf", snippet: mcpRemoteSnippet, icon: "windsurf" },
      {
        label: "Gemini CLI",
        snippet: \`gemini mcp add --transport http "\${identifier}" "\${serverUrl}"\`,
        icon: "gemini",
      },
      { label: "Codex", snippet: mcpRemoteSnippet, icon: "codex" },
    ];

    function mountIcon(container, iconName) {
      const svgMarkup = icons[iconName] || "";
      if (!svgMarkup) return;
      const doc = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
      const svg = doc.documentElement;
      if (svg) container.append(svg);
    }

    if (elements.remoteSnippet) {
      elements.remoteSnippet.textContent = mcpRemoteSnippet;
    }

    if (elements.copyRemoteButton) {
      elements.copyRemoteButton.addEventListener("click", () => {
        const snippet = elements.remoteSnippet?.textContent || "";
        copyText(snippet).then((success) => {
          if (success && elements.copyIcon && elements.checkIcon) {
            elements.copyIcon.classList.remove("visible");
            elements.copyIcon.classList.add("hidden");
            elements.checkIcon.classList.remove("hidden");
            elements.checkIcon.classList.add("visible");
            setTimeout(() => {
              elements.copyIcon?.classList.remove("hidden");
              elements.copyIcon?.classList.add("visible");
              elements.checkIcon?.classList.remove("visible");
              elements.checkIcon?.classList.add("hidden");
            }, 2000);
          } else if (!success) {
            showToast("Unable to copy. Please copy manually.");
          }
        }).catch(() => showToast("Unable to copy. Please copy manually."));
      });
    }

    if (elements.grid) {
      elements.grid.replaceChildren();
      for (const option of connectionOptions) {
        const card = document.createElement("button");
        card.className = "connection-card";
        card.type = "button";

        const inner = document.createElement("span");
        inner.className = "card-inner";

        const iconBadge = document.createElement("span");
        iconBadge.className = "icon-badge";
        mountIcon(iconBadge, option.icon);

        const label = document.createElement("span");
        label.className = "card-label";
        label.textContent = option.label;

        inner.append(iconBadge, label);
        card.append(inner);

        const backgroundIcon = document.createElement("span");
        backgroundIcon.className = "background-icon";
        mountIcon(backgroundIcon, option.icon);
        card.append(backgroundIcon);

        card.addEventListener("click", () => {
          copyText(option.snippet)
            .then((success) => {
              showToast(
                success
                  ? \`\${option.label} connection method copied to clipboard.\`
                  : "Unable to copy. Please copy manually."
              );
            })
            .catch(() => showToast("Unable to copy. Please copy manually."));
        });

        elements.grid.append(card);
      }
    }

    function showToast(message) {
      if (!elements.toast) return;
      elements.toast.textContent = message;
      elements.toast.classList.add("show");
      setTimeout(() => elements.toast?.classList.remove("show"), 2400);
    }

    async function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return fallbackCopy(text);
        }
      }
      return fallbackCopy(text);
    }

    function fallbackCopy(text) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.append(textarea);
        textarea.select();
        const successful = document.execCommand("copy");
        textarea.remove();
        return successful;
      } catch {
        return false;
      }
    }
  })();`;
}

function buildHomeHtml({ css, icons }) {
  const extraCss = `
  .credentials-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.95rem;
  }
  .credentials-table th,
  .credentials-table td {
    padding: 0.65rem 0.5rem;
    border-bottom: 1px solid var(--brand-neutral-500);
    text-align: left;
    vertical-align: top;
  }
  .credentials-table th { color: var(--brand-neutral-100); font-weight: 500; }
  .credentials-table code {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 0.85em;
    color: var(--brand-white);
  }
  .credentials-note { margin-top: 1rem; color: var(--brand-neutral-100); }`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${SERVER_NAME}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>${css}${extraCss}</style>
  </head>
  <body>
    <main class="template-layout">
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 id="server-name" class="display text-gradient">${SERVER_NAME}</h2>
            <p id="server-description" class="lead">${SERVER_DESCRIPTION}</p>
          </div>
        </div>
      </section>
${buildCredentialsSection()}
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Connect to a client</h2>
            <p class="body-text">Select your preferred way to connect to your MCP server.</p>
          </div>
          <div id="connection-grid" class="connection-grid" aria-live="polite"></div>
        </div>
      </section>
      <section class="section">
        <div class="section-content">
          <div class="section-header">
            <h2 class="heading-2 text-gradient">Standard connection</h2>
            <p class="body-text">For clients not listed above, use mcp-remote with Tiendanube headers.</p>
          </div>
          <div class="code-block">
            <button type="button" class="copy-snippet-btn" id="copy-remote-snippet" aria-label="Copy standard connection method">
              <span class="sr-only">Copy standard connection method</span>
              <svg id="copy-icon" class="visible" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="5.25" y="3" width="7.5" height="9.5" rx="1" stroke="currentColor" stroke-width="1.25" />
                <path d="M3.25 10.75V2.75H9.75" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg id="check-icon" class="hidden" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="position: absolute;">
                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <pre><code id="remote-snippet"></code></pre>
          </div>
        </div>
      </section>
    </main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <script>${buildClientScript(icons)}</script>
  </body>
</html>`;
}

const bundle = fs.readFileSync(xmcpHttpPath, "utf-8");
fs.writeFileSync(outputPath, buildHomeHtml(extractFromXmcpBundle(bundle)));
console.log(`Generated ${outputPath}`);
