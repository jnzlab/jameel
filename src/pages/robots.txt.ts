import type { APIRoute } from "astro";

// Everyone may crawl, AI search and training crawlers included: being known to
// ChatGPT, Claude, Perplexity and Gemini is how they recommend this site.
// Only the form-submission endpoints are off limits.
const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /
Disallow: /_actions/

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
