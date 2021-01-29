#!/usr/bin/env node --experimental-specifier-resolution=node
/* eslint-disable no-console */

import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { addItem } from '../lib/data/add-item';
import sendItemWsMessage from '../lib/send-item-ws-message';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const renderFile = promisify(ejs.renderFile);

// server is at www.mjs
const url = 'ws://localhost:3000';

const viewPath = path.join(dirname, '..', 'views', 'item-actions', 'partials', 'item-list.ejs');

/**
 * Create a new item record and send a message to the WS server
 * with a turbo stream of this record.
 */

async function addListItemWs() {
  const item = await addItem();
  const html = await renderFile(viewPath, { items: [item], mode: 'websocket' });

  const stream = {
    action: 'append',
    target: 'item-list',
  };
  console.log('send message with html:', html);
  return sendItemWsMessage(url, stream, html);
}

addListItemWs();
