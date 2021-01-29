import express from 'express';
import EventEmitter from 'events';
import turboStream from 'hotwire-turbo-express';
import multer from 'multer';
import sse from 'server-sent-events';

import * as itemStore from '../../lib/data';
import sendItemWsMessage from '../../lib/send-item-ws-message';
import itemListRoutes from './list';

const STREAM_SOURCES = {
  websocket: `ws://localhost:${process.env.PORT || 3000}`,
  sse: '/items/actions/stream',
};

const routerFactory = () => {
  const router = express.Router();
  const upload = multer();

  const itemActionsEvents = new EventEmitter();

  /**
   * WebSockets example.
   * Listen for events from the itemActionEvents emitter,
   * construct a <turbo-stream> message, and send it via
   * a WebSocket client to the server attached to the express
   * instance (see bin/www.mjs)
   */
  itemActionsEvents.on('items-event', (stream, html) => {
    sendItemWsMessage(STREAM_SOURCES.websocket, stream, html);
  });

  router.use(turboStream());

  router.use('/list', itemListRoutes(upload));

  /**
  * Server Sent Events (SSE) example.
  * Listen for events from the itemActionEvents emitter,
  * construct a <turbo-stream> message, and send it to
  * any clients connected to this route.
  */
  router.get('/actions/stream', sse, async (req, res) => {
    itemActionsEvents.on('items-event', (stream, html) => {
      const tag = new res.turboStream.TurboStream(stream, html);
      res.sse(tag.toSseMessage());
    });
  });

  router.param('mode', async (req, res, next, mode) => {
    res.locals.mode = STREAM_SOURCES[mode] ? mode : 'plain';
    next();
  });

  router.get('/actions/:mode', async (req, res) => {
    const items = await itemStore.load();
    const cursor = items.reduce((acc, i) => ((i.id > acc) ? i.id : acc), 0);
    const { mode } = res.locals;

    return res.render('item-actions/index', {
      cursor,
      items,
      mode,
      streamSource: STREAM_SOURCES[mode],
    });
  });

  const modifyItems = async (listAction, itemId) => {
    switch (listAction) {
      case 'add': {
        // since the turbo action is "append", we only send the new item,
        // not the whole list of items
        const newItem = await itemStore.add();
        return [newItem];
      }
      case 'remove': {
        const items = await itemStore.delete(itemId);
        return items;
      }
      case 'clear': {
        const items = await itemStore.truncate();
        return items;
      }
      case 'reset': {
        const items = await itemStore.seed();
        return items;
      }
      default:
        throw new Error(`Unknown action ${listAction}`);
    }
  };

  /**
  * Contrived example to show usage of different
  * turbo stream action functions.
  */
  router.post('/actions/:mode/modify', upload.none(), async (req, res, next) => {
    const view = 'item-actions/partials/item-list';
    const stream = { target: 'item-list' };
    const listAction = req.body['list-action'];
    try {
      const items = await modifyItems(listAction, req.body.id);
      if (res.locals.mode === 'plain') {
        if (listAction === 'add') {
          return res.turboStream.append(view, { items }, stream);
        }
        return res.turboStream.update(view, { items }, stream);
      }
      const action = listAction === 'add' ? 'append' : 'update';
      return res.render(
        'item-actions/partials/item-list',
        { items },
        (err, html) => {
          itemActionsEvents.emit('items-event', { ...stream, action }, html);
          // do not send html back, the stream sources will send it.
          return res.sendStatus(204);
        },
      );
    } catch (error) {
      return next(error);
    }
  });

  return router;
};

export default routerFactory;
