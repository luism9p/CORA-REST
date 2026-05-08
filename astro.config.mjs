import { defineConfig, envField } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://astrorante.unfolding.io/",
  output: "static",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    vue({
      appEntrypoint: "/src/pages/_app",
    }),
    icon(),
    sitemap(),
  ],
  trailingSlash: "ignore",
  compressHTML: true,
  scopedStyleStrategy: "attribute",
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
  env: {
    schema: {
      SITE_LANG: envField.string({
        context: "server",
        access: "public",
        default: "en",
      }),
      CURRENCY: envField.string({
        context: "server",
        access: "public",
        default: "USD",
      }),
      LOCALE: envField.string({
        context: "server",
        access: "public",
        default: "en-US",
      }),
    },
  },
});
