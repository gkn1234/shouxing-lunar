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
        lunar: resolve(__dirname, 'src/lunar/index.ts'),
        eclipse: resolve(__dirname, 'src/eclipse/index.ts'),
        astronomy: resolve(__dirname, 'src/astronomy/index.ts'),
        data: resolve(__dirname, 'src/data/index.ts'),
      },
      formats: ['es', 'cjs', 'umd'],
      name: 'YhjsLunar',
      fileName: (format, entryName) => {
        if (format === 'es') return `${entryName}.js`;
        if (format === 'cjs') return `${entryName}.cjs`;
        return `${entryName}.umd.js`;
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
});
