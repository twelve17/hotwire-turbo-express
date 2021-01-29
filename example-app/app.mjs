import express from 'express';
import createError from 'http-errors';
// import turboStream from 'hotwire-turbo-express';
import path from 'path';
import { fileURLToPath } from 'url';

import * as itemStore from './lib/data';
import itemRoutes from './routes/items';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// set up our faux database of items
itemStore.seed();

const app = express();

// app.use(turboStream());

// view engine setup
app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(dirname, 'public')));

app.use((req, res, next) => {
  app.locals.title = 'Example App';
  next();
});

app.get('/', (req, res) => res.render('index'));

app.use('/items', itemRoutes());

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(`error:${err.message}`);
});

export default app;
