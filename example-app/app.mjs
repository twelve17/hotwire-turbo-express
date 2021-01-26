import createError from 'http-errors';
import express from 'express';
import path from 'path';
import turboStream  from 'hotwire-turbo-express';
import multer from 'multer';
import { fileURLToPath } from 'url';

import * as itemStore from './lib/data';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

itemStore.seed();

const app = express();

const upload = multer()
app.use(turboStream());

// view engine setup
app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(dirname, 'public')));

app.use(async (req, res, next) => {
  app.locals.title = 'Example App';
  return next();
});

app.get('/', (req, res, next) => {
  return res.render('index');
});

app.get('/item-list', async (req, res, next) => {
  await itemStore.seed();
  const { hasMore, items, nextCursor } = await itemStore.list();
  return res.render('item-list/index', {
    cursor: nextCursor,
    hasMore,
    items
  });
});


app.post('/item-list/page', upload.none(), async (req, res, next) => {
  const { hasMore, items, nextCursor } = await itemStore.list(req.body.cursor);
  return res.turboStream.renderViews([
    {
      stream: {
        action: 'append',
        target: 'item-list',
      },
      variables: { items, cursor: nextCursor },
      view: 'item-list/partials/item-list',
    },
    {
      stream: {
        action: 'replace',
        target: 'item-list-more-button',
      },
      variables: { cursor: nextCursor, hasMore },
      view: 'item-list/partials/item-list-more-button',
    },
  ], true);
});

app.get('/item-actions', async (req, res, next) => {
  const items = await itemStore.load();
  return res.render('item-actions/index', { items });
});

app.post('/item-actions/modify', upload.none(), async (req, res, next) => {
  const view = 'item-actions/partials/item-list';
  const stream = { target: 'item-list' };
  let items;

  const listAction = req.body['list-action'];
  switch (listAction) {
    case "add":
      // since the turbo action is "append", we only send the new item,
      // not the whole list of items
      const newItem = await itemStore.add();
      return res.turboStream.append(view, { items: [newItem] }, stream);
    case "remove":
      const id = req.body['id'];
      items = await itemStore.delete(parseInt(id, 10));
      return res.turboStream.update(view, { items }, stream);
    case "clear":
      items = await itemStore.truncate();
      return res.turboStream.update(view, { items }, stream);
    case "reset":
      items = await itemStore.seed();
      return res.turboStream.update(view, { items }, stream);
    default:
      return next(new Error(`Unknown action ${listAction}`));
  }
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
