import path from 'path';
import pkg from './package.json';

// https://github.com/rollup/rollup-starter-lib
export default [
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.mjs',
    external: ['escape-html', 'util'],
    output: [
      { file: path.join('dist', 'commonjs', 'index.js'), format: 'cjs', exports: 'named' },
      { file: path.join('dist', pkg.module), format: 'es', exports: 'named' },
    ],
  },
  {
    input: 'src/not-acceptable.mjs',
    output: [
      { dir: path.join('dist', 'commonjs'), format: 'cjs' },
      { dir: path.join('dist', 'esm'), format: 'es' },
    ],
  },
];
