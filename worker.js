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
    // Exclusive Endpoint
    // ============================================================

    if (url.pathname !== "/win_default_services_config.map") {

      console.warn({
        event: "DENY_404",
        method: request.method,
        path: url.pathname
      });

      return new Response("Not Found", {
        status: 404
      });

    }

    // ============================================================
    // GET/HEAD Only
    // ============================================================

    if (request.method !== "GET" &&
        request.method !== "HEAD") {

      console.warn({
        event: "DENY_405",
        method: request.method
      });

      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          "Allow": "GET, HEAD"
        }
      });

    }

    // ============================================================
    // Payload Rejection
    // ============================================================

    const contentLength =
      request.headers.get("content-length");

    if (contentLength !== null &&
        Number(contentLength) > 0) {

      console.warn({
        event: "DENY_BODY",
        method: request.method,
        length: contentLength
      });

      return new Response(
        "Request body not allowed",
        {
          status:400
        }
      );

    }

    // ============================================================
    // Redirects
    // ============================================================

    const forwardHeaders = new Headers();

    for (const name of ALLOWED_HEADERS) {

      const value = request.headers.get(name);

      if (value !== null)
        forwardHeaders.set(name, value);

    }

    try {

      const response = await fetch(
        GITHUB_RAW,
        {
          method: request.method,
          headers: forwardHeaders
        }
      );

      // ==========================================================
      // Logging
      // ==========================================================

      console.log({

        method: request.method,

        path: url.pathname,

        status: response.status,

        etag:
          response.headers.get("etag"),

        length:
          response.headers.get("content-length"),

        ifNoneMatch:
          request.headers.get("if-none-match"),

        ifModifiedSince:
          request.headers.get("if-modified-since"),

        userAgent:
          request.headers.get("user-agent")

      });

      // ==========================================================
      // Headers
      // ==========================================================

      const headers =
        new Headers(response.headers);

      headers.set(
        "X-Baseline-Proxy",
        "Cloudflare"
      );

      headers.set(
        "X-Worker-Version",
        "1"
      );

      headers.set(
        "Cache-Control",
        "no-transform"
      );

      return new Response(
        response.body,
        {
          status: response.status,
          statusText: response.statusText,
          headers
        }
      );

    }
    catch(e) {

      console.error({

        event:"FETCH_ERROR",

        message:e.message

      });

      return new Response(
        "Bad Gateway",
        {
          status:502
        }
      );

    }

  }

};
