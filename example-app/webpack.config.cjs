const path = require('path');

module.exports = {
  entry: './src/index.mjs',
  stats: {
    logging: true,
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public', 'js'),
  },
  mode: 'production',
};
