import express from 'express';

import * as itemStore from '../../lib/data';

const router = express.Router();

const routerFactory = (upload) => {
  router.get('/', async (req, res) => {
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
  router.post('/page', upload.none(), async (req, res) => {
    const { hasMore, items, nextCursor } = await itemStore.list(parseInt(req.body.cursor, 10));
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

  return router;
};

export default routerFactory;
