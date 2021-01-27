import express from 'express';
import createError from 'http-errors';
import turboStream, { buildStreamTag } from 'hotwire-turbo-express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import * as itemStore from './lib/data';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// set up our faux database of items
itemStore.seed();

const app = express();

const upload = multer();
app.use(turboStream());

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

app.get('/item-list', async (req, res) => {
  await itemStore.seed();
  const { hasMore, items, nextCursor } = await itemStore.list();
  return res.render('item-list/index', {
    cursor: nextCursor,
    hasMore,
    items,
  });
});

/**
 * Example showing usage of the renderViews function to
 * return multiple turbo streams, each targeting different
 * elements and with different actions.
 */
app.post('/item-list/page', upload.none(), async (req, res) => {
  const { hasMore, items, nextCursor } = await itemStore.list(req.body.cursor);
  return res.turboStream.renderViews([
    {
      stream: {
        action: 'append',
        target: 'item-list',
      },
      variables: { cursor: nextCursor, items },
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

app.get('/item-actions', async (req, res) => {
  const items = await itemStore.load();
  const cursor = items.reduce((acc, i) => ((i.id > acc) ? i.id : acc), 0);
  return res.render('item-actions/index', { cursor, items });
});

/**
 * Contrived SSE example: runs a loop where it will query the
 * faux datasource for a entry with an id (cursor) higher than
 * the one provided in the query string. If any found, renders
 * them in the view partial and sends the combined HTML to the client.
 *
 * This is a dumb example which causes the originating client to
 * end up with duplicated new entries.
 */
app.get('/item-actions/sse-stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let cursor = req.query.cursor ? parseInt(req.query.cursor, 10) + 1 : 0;
  const view = 'item-actions/partials/item-list';
  const stream = { target: 'item-list', action: 'append' };

  const sleepSecs = 1;
  const maxLoops = 1000;
  let loopCount = 0;

  const intervalId = setInterval(async () => {
    loopCount += 1;
    if (loopCount > maxLoops) {
      clearInterval(intervalId);
      res.end();
      return;
    }
    const { items, nextCursor } = await itemStore.list(cursor);

    if (items.length === 0) return;

    const tags = items.reduce((acc, item) => {
      res.render(view, { items: [item] }, (err, html) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('error rendering view:', err.message);
        } else {
          const tag = buildStreamTag(stream, html);
          acc.push(tag);
        }
      });
      return acc;
    }, []);
    const message = `data: ${tags.join('\n').replace(/\n/g, '')}\n\n`;
    res.write(message);
    if (nextCursor) cursor = nextCursor;
  }, sleepSecs * 1000);

  // If client closes connection, stop sending events
  res.on('close', () => {
    // eslint-disable-next-line no-console
    console.log('SSE client disconnected');
    clearInterval(intervalId);
    res.end();
  });
});

/**
 * Contrived example to show usage of different
 * turbo stream action functions.
 */
app.post('/item-actions/modify', upload.none(), async (req, res, next) => {
  const view = 'item-actions/partials/item-list';
  const stream = { target: 'item-list' };

  const listAction = req.body['list-action'];
  switch (listAction) {
    case 'add': {
      // since the turbo action is "append", we only send the new item,
      // not the whole list of items
      const newItem = await itemStore.add();
      return res.turboStream.append(view, { items: [newItem] }, stream);
    }
    case 'remove': {
      const { id } = req.body;
      const items = await itemStore.delete(parseInt(id, 10));
      return res.turboStream.update(view, { items }, stream);
    }
    case 'clear': {
      const items = await itemStore.truncate();
      return res.turboStream.update(view, { items }, stream);
    }
    case 'reset': {
      const items = await itemStore.seed();
      return res.turboStream.update(view, { items }, stream);
    }
    default:
      return next(new Error(`Unknown action ${listAction}`));
  }
});

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
