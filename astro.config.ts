import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
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
      GITHUB_TOKEN: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
    },
  },
});
