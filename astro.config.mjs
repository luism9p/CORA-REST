import { defineConfig, envField } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // TODO: reemplaza esto por el dominio real una vez publicado (el de Vercel o uno propio).
  // Se usa para generar URLs absolutas (og:image, sitemap.xml); mientras esté mal, esas
  // previews (WhatsApp, Facebook, etc.) no van a resolver la imagen del logo.
  site: "https://cora-lobitos.vercel.app/",
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
