module.exports = {
  plugins: ['mocha'],
  root: true,
  env: {
    browser: false,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  ignorePatterns: ['public/**', '*.ejs'],
  rules: {
    'import/prefer-default-export': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  },
  overrides: [
    {
      files: ['routes/**/*.mjs', 'views/**/*.ejs'],
      rules: {
        'no-underscore-dangle': 'off',
      },
    },
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
