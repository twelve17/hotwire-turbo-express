module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
  },
  extends: [
    'airbnb-base',
  ],
  ignorePatterns: ['dist', 'example-app', 'node_modules'],
  plugins: [
    'mocha',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'import/prefer-default-export': 'off',
  },
};
