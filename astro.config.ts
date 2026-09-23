import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeExternalLinks, { type Options as ExternalLinksOptions } from "rehype-external-links";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";
import { readdirSync, readFileSync } from "node:fs";

// https://astro.build/config
const siteUrl = new URL(SITE.website);

// Only treat links pointing outside this site as external.
// Links to the site's own origin stay in the current tab.
const externalLinksOptions: ExternalLinksOptions = {
  target: "_blank",
  rel: ["noopener", "noreferrer"],
  test: node => {
    const href = node.properties?.href;
    if (typeof href !== "string") return false;
    try {
      return new URL(href, siteUrl).origin !== siteUrl.origin;
    } catch {
      return false;
    }
  },
};

// Sitemap <lastmod> for posts comes from frontmatter (modDatetime ?? pubDatetime),
// not build time: Google only trusts lastmod when it tracks real content changes.
const BLOG_DIR = "./src/data/blog";
const postLastmod = new Map<string, string>();
for (const file of readdirSync(BLOG_DIR)) {
  if (!file.endsWith(".md") || file.startsWith("_")) continue;
  const frontmatter = readFileSync(`${BLOG_DIR}/${file}`, "utf8").split("---")[1] ?? "";
  if (/^draft:\s*true/m.test(frontmatter)) continue;
  const date =
    frontmatter.match(/^modDatetime:\s*(\S+)/m)?.[1] ??
    frontmatter.match(/^pubDatetime:\s*(\S+)/m)?.[1];
  if (date && date !== "null") {
    // URLs use the frontmatter slug when present, else the file name.
    const slug = frontmatter.match(/^slug:\s*["']?([^"'\s]+)/m)?.[1] ?? file.replace(/\.md$/, "");
    postLastmod.set(slug, new Date(date).toISOString());
  }
}
const latestPost = [...postLastmod.values()].sort().at(-1);

// Pages that exist for navigation but add no unique content to search results.
// They are also marked noindex in their templates.
const excludeFromSitemap = (url: string) => {
  const path = new URL(url).pathname;
  return (
    path === "/search/" ||
    path.startsWith("/tags/") ||
    /^\/posts\/\d+\/$/.test(path) ||
    (!SITE.showArchives && path === "/archives/")
  );
};

export default defineConfig({
  site: SITE.website,
  // Pages stay prerendered; the adapter only serves on-demand routes such as
  // Astro Actions (contact form, post feedback).
  adapter: vercel(),
  // One URL per page: /about/ is canonical and /about redirects to it.
  trailingSlash: "always",
  // Astro 7 defaults to JSX-style whitespace stripping ("jsx"), which glues
  // adjacent inline elements together in our templates. Keep HTML semantics.
  compressHTML: true,
  integrations: [
    sitemap({
      filter: page => !excludeFromSitemap(page),
      serialize: item => {
        const path = new URL(item.url).pathname;
        const slug = path.match(/^\/posts\/(.+)\/$/)?.[1];
        const lastmod = slug ? postLastmod.get(slug) : undefined;
        if (lastmod) return { ...item, lastmod };
        // Listing pages change whenever a post is added.
        if ((path === "/" || path === "/posts/" || path === "/archives/") && latestPost) {
          return { ...item, lastmod: latestPost };
        }
        return item;
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [[rehypeExternalLinks, externalLinksOptions]],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // Read-only GitHub token for repo metadata on the home page (optional).
      GITHUB_ACCESS_TOKEN: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Contact form + post feedback. All optional so the site still builds
      // without them; the actions report "not configured" instead.
      SUPABASE_URL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      SUPABASE_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      RESEND_API_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Sender for notification emails; jnzlab.io is verified in Resend.
      RESEND_FROM: envField.string({
        access: "secret",
        context: "server",
        default: "jnzlab.io <notifications@jnzlab.io>",
      }),
      CONTACT_TO_EMAIL: envField.string({
        access: "secret",
        context: "server",
        default: "jameel@jnzlab.io",
      }),
      TURNSTILE_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Comma-separated frontend hostnames siteverify must report. Defaults to
      // the SITE hostname (plus localhost in dev only).
      TURNSTILE_HOSTNAMES: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      TURNSTILE_SITE_KEY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
});
