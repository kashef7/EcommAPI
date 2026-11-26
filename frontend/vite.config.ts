import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';

function buildProductionCsp(html: string): string {
  const styleMatches = html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
  const styleHashes: string[] = [];
  for (const match of styleMatches) {
    const cssText = match[1];
    if (cssText !== undefined) {
      const digest = createHash('sha256').update(cssText, 'utf8').digest('base64');
      styleHashes.push(`'sha256-${digest}'`);
    }
  }
  const styleSrc = ["'self'", ...styleHashes].join(' ');
  return [
    "default-src 'self'",
    "script-src 'self'",
    `style-src ${styleSrc}`,
    "font-src 'self'",
    "img-src 'self' https: data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function productionHeadEnhancements(): Plugin {
  return {
    name: 'royal-market-production-head',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const cspValue = buildProductionCsp(html);
        const tags: HtmlTagDescriptor[] = [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: cspValue,
            },
            injectTo: 'head-prepend',
          },
        ];

        if (ctx.bundle) {
          const primaryFontAssets = Object.keys(ctx.bundle).filter(
            (fileName) =>
              fileName.endsWith('.woff2') &&
              (fileName.includes('source-serif-4-latin-wght-normal') ||
                fileName.includes('source-sans-3-latin-wght-normal')),
          );

          for (const fileName of primaryFontAssets) {
            tags.push({
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'font',
                type: 'font/woff2',
                href: `/${fileName}`,
                crossorigin: true,
              },
              injectTo: 'head',
            });
          }
        }

        return tags;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env['API_PROXY_TARGET']?.trim() || 'http://localhost:5126';

  return {
    appType: 'mpa',
    plugins: [preact(), productionHeadEnhancements()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          product: fileURLToPath(new URL('./product.html', import.meta.url)),
          cart: fileURLToPath(new URL('./cart.html', import.meta.url)),
          login: fileURLToPath(new URL('./login.html', import.meta.url)),
          signup: fileURLToPath(new URL('./signup.html', import.meta.url)),
          profile: fileURLToPath(new URL('./profile.html', import.meta.url)),
          admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
          adminProduct: fileURLToPath(new URL('./admin/product.html', import.meta.url)),
          adminCategories: fileURLToPath(new URL('./admin/categories.html', import.meta.url)),
        },
      },
    },
  };
});
