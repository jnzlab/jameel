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

export default defineConfig({
  site: SITE.website,
  // Pages stay prerendered; the adapter only serves on-demand routes such as
  // Astro Actions (contact form, post feedback).
  adapter: vercel(),
  // Astro 7 defaults to JSX-style whitespace stripping ("jsx"), which glues
  // adjacent inline elements together in our templates. Keep HTML semantics.
  compressHTML: true,
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
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
