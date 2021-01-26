module.exports = {
  plugins: ['mocha'],
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
  ignorePatterns: ['public/stylesheets/**'],
  rules: {
    'import/prefer-default-export': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  },
  overrides: [
   {
      files: ['routes/**/*.js', 'views/**/*.ejs'],
      rules: {
        'no-underscore-dangle': 'off',
      },
    },

  ],
};
