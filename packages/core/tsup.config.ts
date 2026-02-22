import { defineConfig, type Options } from 'tsup';

// tsup 构建配置
const config: Options = {
  entry: {
    index: 'src/index.ts',
    'diff-analyzer': 'src/diff-analyzer/index.ts',
    'content-engine': 'src/content-engine/index.ts',
    'context-reader': 'src/context-reader/index.ts',
    'doc-sync': 'src/doc-sync/index.ts',
    'seo': 'src/seo/index.ts',
    'ai': 'src/ai/index.ts',
    'git-service': 'src/git-service.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    '@prisma/client',
  ],
  tsconfig: './tsconfig.json',
};

export default defineConfig(config);
