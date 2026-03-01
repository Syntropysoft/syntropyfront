import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true
    },
    {
      file: 'dist/index.min.js',
      format: 'iife',
      name: 'SyntropyFront',
      sourcemap: true,
      inlineDynamicImports: true,
      plugins: [terser()]
    }
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs()
  ],
  onwarn(warning, warn) {
    // Ignore circular dependency warnings for our proxy tracking
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      return;
    }
    warn(warning);
  }
}); 