import { defineConfig, type Options } from 'tsup';

// API 构建配置
const config: Options = {
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    '@prisma/client',
  ],
};

export default defineConfig(config);
