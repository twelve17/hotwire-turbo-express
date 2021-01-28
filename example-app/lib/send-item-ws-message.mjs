import { TurboStream } from 'hotwire-turbo-express';
import WebSocket from 'ws';

/**
 * Create a new item record and send a message to the WS server
 * with a turbo stream of the given html.
 */
const sendItemWsMessage = (url, stream, html) => {
  const tag = new TurboStream(stream, html);
  const ws = new WebSocket(url);
  ws.on('open', async () => {
    ws.send(tag.toWebSocketMessage());
    return ws.close();
  });
};

export default sendItemWsMessage;
