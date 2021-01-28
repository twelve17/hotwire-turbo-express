import path from 'path';
import copy from 'rollup-plugin-copy';
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
      { file: pkg.main, format: 'cjs', exports: 'named' },
      { file: pkg.module, format: 'es', exports: 'named' },
    ],
    plugins: [
      copy({
        targets: [
          { src: 'docs', dest: 'dist/' },
        ],
      }),
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
