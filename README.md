# hotwire-turbo-express

![Node.js CI](https://github.com/twelve17/hotwire-turbo-express/workflows/Node.js%20CI/badge.svg)

ExpressJS middleware for <a href="https://hotwire.dev/">hotwire</a> <a href="https://turbo.hotwire.dev/">Turbo</a> streams.

# Requirements

- Node 14.x or newer

# Installation

```
npm i hotwire-turbo-express
```

# Turbo Stream Protocol Notes

Turbo is integrated with SSE or WebSockets by way of the `connectStreamSource` and `disconnectStreamSource` functions.


- Make Turbo a client listening to WebSocket messages at a given endpoint:
```
connectStreamSource(new WebSocket('ws://foo/bar');
```

- Make turbo a client listening to SSE messages at a given endpoint:

```
connectStreamSource(new EventSource('http://foo/bar');
```

Once connected, messages with `<turbo-stream>`  HTML snippets will be processed by Turbo.

There is an example using stimulus in the example app, at `src/controllers/stream-controller`.

## Server-Side Events (SSE) Payload Format

Payload format is: `data: ` {html with turbo stream HTML in one line}:

```
data: <turbo-stream action='append' target='item-list'>  <template>    <p>My new Message</p>  </template>  </turbo-stream>
```

Express response:
```
# must be in one line, to conform to EventSource message format.
res.write("data: <turbo-stream action='append'...>")
```

See example in the `/item-actions/sse-stream` route in `example-app/app.mjs`.

## WebSocket Payload Format

Payload format is just the HTML in one line.

```
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', async () => {
  ws.send("<turbo-stream><template>My new message</template></turbo-stream>");
  return ws.close();
});
```

See example server at the bottom of `example-app/bin/www.mjs` and client in `example-app/add-list-item-ws.mjs`.

# TODO

- Document SSE and Websocket examples in example-app.

# Examples

Given the `MessagesController` example in the <a href="https://turbo.hotwire.dev/handbook/streams">Turbo Stream Ruby example</a>, this would be the equivalent in expressjs:

```
# app.js

const app = express();

const upload = multer()
app.use(turboStream());

app.post('/messages/create', upload.none(), async (req, res, next) => {
  const message = createMessage(...);
  const locals = { message };
  const view = 'messages/partials/message';
  const stream = { target: 'list' }
  return res.turboStream.append(view, locals, stream);
});
```

See more examples in the example-app.

# example-app

## Setup and Run

```
npm run example:setup
npm run example:start
```

Browse to http://localhost:3000

# 🎩 Tip To

- [NPM building](https://mikbry.com/blog/javascript/npm/best-practices-npm-package) with [packito](https://github.com/mikbry/packito)
- [Rollup config](https://github.com/rollup/rollup-starter-lib/blob/master/rollup.config.js)
- [Turbo stream - WebSockets](https://twitter.com/dunglas/status/1346088916030529537)