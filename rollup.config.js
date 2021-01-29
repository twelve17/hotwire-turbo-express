import path from 'path';
import copy from 'rollup-plugin-copy';

const esmEntry = (paths, opts) => (
  {
    file: path.join('dist', 'esm', ...(paths || [])),
    format: 'es',
    ...(opts || {}),
  }
);

const commonJsEntry = (paths, opts) => {
  console.log('paths', paths, 'opts', opts);
  return {
    dir: path.join('dist', 'commonjs', ...(paths || [])),
    format: 'cjs',
    ...(opts || {}),
  };
};

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
    external: ['util'],
    output: [
      { dir: path.join('dist', 'commonjs'), format: 'cjs', exports: 'named' },
      { file: path.join('dist', 'esm', 'index.mjs'), format: 'es', exports: 'named' },
    ],
    plugins: [
      copy({
        targets: [
          { src: 'docs', dest: 'dist/' },
          { src: 'README.md', dest: 'dist/' },
        ],
      }),
    ],
  },
  /*
  {
    input: 'src/not-acceptable.mjs',
    output: [
      commonJsEntry(),
      esmEntry(['not-acceptable.mjs']),
    ],
  },
  {
    input: 'src/turbo-stream/index.mjs',
    output: [
      commonJsEntry(['turbo-stream'], { exports: 'default' }),
      esmEntry(['turbo-stream', 'index.mjs'], { exports: 'default' }),
    ],
    external: ['escape-html'],
  },
  {
    input: 'src/turbo-stream/create-tag.mjs',
    output: [
      commonJsEntry(['turbo-stream'], { exports: 'default' }),
      esmEntry(['turbo-stream', 'create-tag.mjs']),
    ],
    external: ['escape-html'],
  },
  */
];
