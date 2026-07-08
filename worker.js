const GITHUB_RAW =
  "https://raw.githubusercontent.com/danbussoni/plug-n-dont-play-me-raw-data/main/win_default_services_config.map";

const ALLOWED_HEADERS = [
  "accept",
  "accept-encoding",
  "cache-control",
  "if-none-match",
  "if-modified-since",
  "user-agent"
];

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ============================================================
    // Single allowed endpoint
    // ============================================================
    if (url.pathname !== "/win_default_services_config.map") {
      console.warn({
        event: "DENY_404",
        method: request.method,
        path: url.pathname
      });

      return new Response("Not Found", { status: 404 });
    }

    // ============================================================
    // GET & HEAD only
    // ============================================================
    if (request.method !== "GET" && request.method !== "HEAD") {
      console.warn({
        event: "DENY_405",
        method: request.method
      });

      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Allow": "GET, HEAD" }
      });
    }

    // ============================================================
    // Payload rejection
    // ============================================================
    const contentLength = request.headers.get("content-length");

    if (contentLength !== null && Number(contentLength) > 0) {
      console.warn({
        event: "DENY_BODY",
        method: request.method,
        length: contentLength
      });

      return new Response("Request body not allowed", { status: 400 });
    }

    // ============================================================
    // Forwards only the necessary headers.
    // ============================================================
    const forwardHeaders = new Headers();

    for (const name of ALLOWED_HEADERS) {
      const value = request.headers.get(name);
      if (value !== null) forwardHeaders.set(name, value);
    }

    try {
      // ⚡ Added cf: { encodeBody: false } to prevent dynamic compressions
      // that force the use of the Chunked protocol on the mesh.
      const response = await fetch(GITHUB_RAW, {
        method: request.method,
        headers: forwardHeaders,
        cf: { encodeBody: false }
      });

      // ==========================================================
      // Logging
      // ==========================================================
      console.log({
        method: request.method,
        path: url.pathname,
        status: response.status,
        etag: response.headers.get("etag"),
        length: response.headers.get("content-length"),
        ifNoneMatch: request.headers.get("if-none-match"),
        ifModifiedSince: request.headers.get("if-modified-since"),
        userAgent: request.headers.get("user-agent")
      });

      // ==========================================================
      // Preserves ALL GitHub headers and injects static control.
      // ==========================================================
      const headers = new Headers(response.headers);

      headers.set("X-Baseline-Proxy", "Cloudflare");
      headers.set("X-Worker-Version", "1.1");
      
      // ⚡ Forces the Cache-Control header to instruct intermediate proxies
      // and CDNs not to alter the payload in any way.
      headers.set("Cache-Control", "no-transform, public, max-age=0");

      // ⚡ Captures the original size delivered by GitHub.
      const originalLength = response.headers.get("content-length");

      // Manually setting Content-Length in the final Worker response
      if (originalLength) {
        headers.set("Content-Length", originalLength);
      }

      // ⚡ For HEAD requests, explicitly return a null body.
      // This prevents Cloudflare's V8 engine from attempting to calculate 
      // the streaming of an empty body and removing the Content-Length header we injected above.
      const responseBody = request.method === "HEAD" ? null : response.body;

      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (e) {
      console.error({
        event: "FETCH_ERROR",
        message: e.message
      });

      return new Response("Bad Gateway", { status: 502 });
    }
  }
};

  }

};
