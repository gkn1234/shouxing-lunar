import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
      include: ['src/**/*.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'lunar/index': resolve(__dirname, 'src/lunar/index.ts'),
        'eclipse/index': resolve(__dirname, 'src/eclipse/index.ts'),
        'ephemeris/index': resolve(__dirname, 'src/ephemeris/index.ts'),
        'astronomy/index': resolve(__dirname, 'src/astronomy/index.ts'),
        'data/index': resolve(__dirname, 'src/data/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'es') return `${entryName}.js`;
        return `${entryName}.cjs`;
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
});
