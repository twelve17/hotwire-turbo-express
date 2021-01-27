import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import turboStream from '../../src/index';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const createApp = (testCase) => {
  const app = express();
  app.set('views', path.join(dirname, 'views'));
  app.set('view engine', 'ejs');
  app.use(turboStream());
  app.get('/test', async (req, res, next) => {
    try {
      const result = await testCase(req, res, next);
      return result;
    } catch (err) {
      res.status(err.status || 500);
      return res.send(`Got an error!: ${err.message}`);
    }
  });
  // need arity of 4
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(500).send(`Unexpected error: ${err.message}`));

  return app;
};
