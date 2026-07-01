/**
 * R&R Records API Proxy - Cloudflare Worker
 * Proxies requests to DeepSeek, Last.fm, and Discogs from the browser
 * All API keys stored as Cloudflare environment variables, never in the browser
 *
 * Deploy: npx wrangler deploy
 * Set secrets: npx wrangler secret put LLM_KEY   (DeepSeek API key)
 *              npx wrangler secret put LFM_KEY   (Last.fm API key)
 *              npx wrangler secret put DGS_KEY   (Discogs API token)
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    try {
      let response;

      if (url.pathname === "/api/llm") {
        // DeepSeek LLM proxy
        const body = await request.json();
        response = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.LLM_KEY}`,
          },
          body: JSON.stringify(body),
        });
      } else if (url.pathname === "/api/lastfm") {
        // Last.fm proxy (passes through query params)
        const params = url.searchParams.toString();
        const lfmUrl = `https://ws.audioscrobbler.com/2.0/?${params}&api_key=${env.LFM_KEY}&format=json`;
        response = await fetch(lfmUrl);
      } else if (url.pathname === "/api/discogs") {
        // Discogs proxy (passes through query params)
        const params = url.searchParams.toString();
        const dgsUrl = `https://api.discogs.com/${url.search ? "?" + url.searchParams.toString() : ""}`;
        // Reconstruct the Discogs URL properly
        const q = url.searchParams.get("q") || "";
        const type = url.searchParams.get("type") || "release";
        const perPage = url.searchParams.get("per_page") || "1";
        const dgsApiUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&type=${type}&per_page=${perPage}&token=${env.DGS_KEY}`;
        response = await fetch(dgsApiUrl);
      } else {
        return new Response("Not found", { status: 404, headers });
      }

      // Forward the response with CORS headers
      const responseHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v));
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
  },
};
