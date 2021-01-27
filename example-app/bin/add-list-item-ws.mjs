#!/usr/bin/env node --experimental-specifier-resolution=node
/* eslint-disable no-console */

import ejs from 'ejs';
import { buildStreamTag } from 'hotwire-turbo-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import WebSocket from 'ws';
import { addItem } from '../lib/data/add-item';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const renderFile = promisify(ejs.renderFile);

// server is at www.mjs
const ws = new WebSocket('ws://localhost:3000');

const viewPath = path.join(dirname, '..', 'views', 'item-actions', 'partials', 'item-list.ejs');

/**
 * Create a new item record and send a message to the WS server
 * with a turbo stream of this record.
 */
ws.on('open', async () => {
  const item = await addItem();
  const view = await renderFile(viewPath, { items: [item] });

  const tag = await buildStreamTag({
    action: 'append',
    target: 'item-list',
  }, view);
  const message = tag.replace(/\n/g, '');
  console.log('send message:', message);
  ws.send(message);
  return ws.close();
});
