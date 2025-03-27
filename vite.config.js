import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev';
import { defineConfig } from 'vite';
import jsconfigPaths from 'vite-jsconfig-paths';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeImgSize from 'rehype-img-size';
import rehypeSlug from 'rehype-slug';
import rehypePrism from '@mapbox/rehype-prism';
import fs from 'fs';
import path from 'path';

// Custom plugin to handle GLSL files with ?raw query
const glslPlugin = {
  name: 'vite-plugin-glsl',
  resolveId(source, importer) {
    if (source.endsWith('.glsl?raw')) {
      // Remove the ?raw suffix for resolution
      const realSource = source.replace(/\?raw$/, '');
      const resolved = path.resolve(path.dirname(importer), realSource);
      return resolved + '?raw';
    }
  },
  load(id) {
    if (id.endsWith('.glsl?raw')) {
      // Remove the ?raw suffix for loading
      const realId = id.replace(/\?raw$/, '');
      const code = fs.readFileSync(realId, 'utf-8');
      return `export default ${JSON.stringify(code)};`;
    }
  }
};

export default defineConfig({
  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.glsl'],
  build: {
    assetsInlineLimit: 1024,
  },
  server: {
    port: 7777,
  },
  plugins: [
    glslPlugin,
    mdx({
      rehypePlugins: [[rehypeImgSize, { dir: 'public' }], rehypeSlug, rehypePrism],
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      providerImportSource: '@mdx-js/react',
    }),
    remixCloudflareDevProxy(),
    remix({
      routes(defineRoutes) {
        return defineRoutes(route => {
          route('/', 'routes/home/route.js', { index: true });
        });
      },
    }),
    jsconfigPaths(),
  ],
});
