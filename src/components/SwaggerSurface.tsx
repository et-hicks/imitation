"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: (options: Record<string, unknown>) => unknown;
  }
}

const SCRIPT_ID = "swagger-ui-script";
const STYLE_ID = "swagger-ui-style";
const SWAGGER_JS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
const SWAGGER_CSS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";

async function loadScript(id: string, src: string) {
  if (document.getElementById(id)) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function ensureStylesheet(id: string, href: string) {
  if (document.getElementById(id)) {
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export default function SwaggerSurface() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        ensureStylesheet(STYLE_ID, SWAGGER_CSS);
        await loadScript(SCRIPT_ID, SWAGGER_JS);
        if (!mounted) {
          return;
        }
        if (window.SwaggerUIBundle && containerRef.current) {
          window.SwaggerUIBundle({
            url: "/api/openapi",
            domNode: containerRef.current,
            docExpansion: "none",
            deepLinking: true,
          });
        }
      } catch (error) {
        console.error("Failed to load Swagger UI", error);
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, []);

  return <div ref={containerRef} className="swagger-ui" />;
}
