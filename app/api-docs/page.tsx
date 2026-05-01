"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";

export default function ApiDocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // @ts-ignore
    if (window.SwaggerUIBundle && swaggerRef.current) {
      // @ts-ignore
      window.SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          // @ts-ignore
          window.SwaggerUIBundle.presets.apis,
          // @ts-ignore
          window.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        theme: "dark"
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Script 
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" 
        onLoad={() => {
            // @ts-ignore
            window.SwaggerUIBundle({
                url: "/api/openapi.json",
                dom_id: "#swagger-ui",
                deepLinking: true,
                presets: [
                  // @ts-ignore
                  window.SwaggerUIBundle.presets.apis,
                ],
                layout: "BaseLayout",
              });
        }}
      />
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      
      <div className="p-6 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold text-[#7c6af7]">PhishSlayer API Explorer</h1>
                <p className="text-xs text-slate-400">Interactive OpenAPI Specification</p>
            </div>
            <Link 
                href="/dashboard" 
                className="text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                Back to Dashboard
            </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10 px-6">
        <div id="swagger-ui" className="bg-white rounded-2xl overflow-hidden" />
      </div>

      <style jsx global>{`
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .scheme-container { background: transparent; box-shadow: none; border-bottom: 1px solid #eee }
      `}</style>
    </div>
  );
}
