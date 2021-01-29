module.exports = {
  plugins: ['mocha'],
  root: true,
  env: {
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  ignorePatterns: ['public/**', '*.ejs', 'tmp'],
  rules: {
    'import/prefer-default-export': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  },
  overrides: [
    {
      files: ['views/**/*.ejs'],
      rules: {
        'no-underscore-dangle': 'off',
      },
    },
    // browser
    {
      files: ['src/**/*.mjs'],
      env: {
        browser: true,
      },
      rules: {
        'import/extensions': 'off',
      },
    },

  ],
};
