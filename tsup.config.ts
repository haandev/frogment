import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/frogment.ts'],
  format: ['esm'],
  dts: true,
  minify: true,
  clean: true,
  outDir: 'dist'
})
