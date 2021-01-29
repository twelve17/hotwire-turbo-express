# hotwire-turbo-express

![Node.js CI](https://github.com/twelve17/hotwire-turbo-express/workflows/Node.js%20CI/badge.svg)

ExpressJS middleware for sending turbo-stream HTML fragments to a <a href="https://hotwire.dev/">hotwire</a> <a href="https://turbo.hotwire.dev/">Turbo</a> client. It aims to perform a subset of functionality that <a href="https://github.com/hotwired/turbo-rails">turbo-rails provides</a> with <a href="https://docs.ruby-lang.org/en/2.3.0/ERB.html">ERB templates</a>, but with <a href="https://ejs.co">EJS</a> templates.

## Requirements

- Node 14.x or newer

## Installation

```
npm i hotwire-turbo-express
```

## Overview

When a Turbo encounters a `<turbo-stream>` element in a HTML fragment delivered by a server over a ["WebSocket, SSE or other transport"](https://turbo.hotwire.dev/handbook/streams), the DOM element with an id that matches the `target` attribute will be modified with the updates inside the `<turbo-stream>`.

### HTTP Response Stream

In this scenario, a client submits a form.

1. Turbo includes `text/vnd.turbo-stream.html` in the HTTP `Accept` header.
2. The server detects the above header and responds with `Content-Type: text/vnd.turbo-stream.html`, and includes a HTML fragment with one or more `<turbo-stream>` elements.
3. On the client, `Turbo` will process the above streams and update the matching DOM elements.

### WebSocket & SSE

Here, a [stimulus controller](https://stimulus.hotwire.dev) connected to a HTML element will open a Websocket or [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) connection to a server. Whenever a message comes in which has `<turbo-stream>` tags, Turbo will process its contents in the same fashion as in the HTTP Response Stream scenario.

## Usage

- `turboStream` - Middleware function for express.

  Options:
  - `mimeType` - The Turbo stream MIME type. Defaults to `text/vnd.turbo-stream.html`.

  ```
  import turboStream from 'hotwire-turbo-express';

  const app = express();

  app.use(turboStream());
  ```

The middleware will add a `res.turboStream` property with some functions:
- `append`, `prepend`, `replace`, and `update` - These functions are the equivalent of the turbo-rails `turbo_stream.append`, `turbo_stream.prepend`, etc, methods, with a slightly different options to more closely match how EJS works in express:
  - `turboStream.append(view, locals, stream, onlyFormat)`

    options:
    - `view` and `locals` are the same arguments that would be passed to [`res.render`](https://expressjs.com/en/4x/api.html#res.render>`)</a>.
    - `stream` is an object of which attributes will be added to the `turbo-stream` HTML element, with the exception of `action`, which will be set to the value matching the append/prepend/replace/update function.

  Given the `MessagesController` rails example <a href="https://turbo.hotwire.dev/handbook/streams">in the turbo docs</a>, this would be the equivalent here:
    ```
    const upload = multer();

    app.post('/messages/create', upload.none(), async (req, res, next) => {
      const message = createMessage(...);
      const locals = { message };
      const view = 'messages/partials/message';
      const stream = { target: 'list' }
      return res.turboStream.append(view, locals, stream);
    });
    ```
  - `renderViews` - The append/prepend/replace/update functions send a single `<turbo-stream>` element in the response. However, you can ["render any number of stream elements in a single stream message"](https://turbo.hotwire.dev/handbook/streams). `renderViews` providers this ability by accepting an array of objects, each which will result in a `<turbo-stream>` element with its own properties. Each entry is tied to a given EJS view to be rendered.
    - `turboStream.renderViews(<array of stream specs>, <onlyFormat>)
    Stream spec array attributes:
      - `view` and `locals`  accept the same arguments that would be passed to [`res.render`](https://expressjs.com/en/4x/api.html#res.render>`)</a>.
      - `stream` is an object of which attributes will be added to the `turbo-stream` HTML element
    ```
    router.post('/page', upload.none(), async (req, res) => {
        const { hasMore, items } = await getItems();
        return res.turboStream.renderViews([
          {
            stream: {
              action: 'append',
              target: 'item-list',
            },
            locals: { items },
            view: 'item-list/partials/item-list',
          },
          {
            stream: {
              action: 'replace',
              target: 'item-list-more-button',
            },
            locals: { hasMore },
            view: 'item-list/partials/item-list-more-button',
          },
        ], true);
      });
      ```
    - `TurboStream` - A simple class for creating `<turbo-stream>` HTML fragments.
      - constructor: `new TurboStream(attributes, content)`
        - `attributes` - An object of attributes to set in the `<turbo-stream>` tag.
        - `content` - A string with the content to place as the child element of the tag.
      - Instance methods:
          - `toHtml()`  - Returns an HTML fragment string.
          ```
            > tag = new turboStream.TurboStream({ action: 'append' }, "hi there")
            > console.log(tag.toHtml())

              <turbo-stream action="append">
                <template>
                  hi there
                </template>
              </turbo-stream>
          ```
          - `toSseMessage()` - Returns an HTML fragment string suitable for sending in a server sent event message. The Turbo client [looks for the `<turbo-stream>` in the `data` attribute](https://github.com/hotwired/turbo/blob/main/src/observers/stream_observer.ts#L60). The message will include two newline characters at the end, to signal a flush of the SSE response.
          ```
            > tag = new turboStream.TurboStream({ action: 'append' }, "hi there")
            > console.log(tag.toSseMessage())
            data: <turbo-stream action="append">    <template>      hi there    </template>  </turbo-stream>
          ```
          - `toWebSocketMessage()` - Returns an HTML fragment string suitable for sending in a WebSocket message.
          ```
            > tag = new turboStream.TurboStream({ action: 'append' }, "hi there")
            > console.log(tag.toWebSocketMessage())
            > <turbo-stream action="append">    <template>      hi there    </template>  </turbo-stream>
          ```
          While this will work, consider expanding the scope of these messages, e.g. to include signing messages to ensure they are not tampered with, [as is done in turbo-rails](https://github.com/hotwired/turbo-rails/blob/6ba6e005990682a61d82067dc141afdc98bd6c22/app/channels/turbo/streams/stream_name.rb).

- `TurboStream` is also exported so you can use it on its own. Here is an example of sending a turbo stream message over WebSocket:
```
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

```

[JSDocs](https://twelve17.github.io/hotwire-turbo-express/global.html)

# example-app

The example app has complete implementations showing how to use this library to work with `<turbo-stream>`s. Explanation of the use cases are shown in the app itself.

## Setup and Run

```
# builds the NPM, installs it in the app
npm run example:setup

# calls npm start in the app
npm run example:start
```

Browse to http://localhost:3000

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

There is an example using stimulus in the example app, in [`src/controllers/stream-controller`](https://github.com/twelve17/hotwire-turbo-express/blob/main/example-app/src/controllers/stream-controller.mjs).

## Server Sent Events (SSE) Payload Format

Payload format is: `data: ` {html with turbo stream HTML in one line}:

```
data: <turbo-stream action='append' target='item-list'>  <template>    <p>My new Message</p>  </template>  </turbo-stream>
```

Express response:
```
# must be in one line, to conform to EventSource message format.
res.write("data: <turbo-stream action='append'...>")
```

See example in the [`/items/actions/stream`](https://github.com/twelve17/hotwire-turbo-express/blob/main/example-app/routes/items/index.mjs#L43) route in `example-app/app.mjs`.

## WebSocket Payload Format

Payload format is just the HTML in one line.

```
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', async () => {
  ws.send("<turbo-stream><template>My new message</template></turbo-stream>");
  return ws.close();
});
```

See example server at the bottom of [`example-app/bin/www.mjs`](https://github.com/twelve17/hotwire-turbo-express/blob/main/example-app/bin/www.mjs#L97) and client in [`example-app/lib/send-item-ws-message.mjs`](https://github.com/twelve17/hotwire-turbo-express/blob/main/example-app/lib/send-item-ws-message.mjs).

# Development

## Publishing

```
npm run release
```

Seems that `np`'s `contents` flag [does not work how I expected](https://github.com/sindresorhus/np/issues/551#issuecomment-768661956), and `packito` [seems to not have publishing working yet](https://github.com/mikbry/packito/issues/29),
so the relase will run both `packito` and `np` without publishing, then delegate to `npm publish ./dist`.

# 🎩 Tip To

- [NPM building](https://mikbry.com/blog/javascript/npm/best-practices-npm-package) with [packito](https://github.com/mikbry/packito)
- [Rollup config](https://github.com/rollup/rollup-starter-lib/blob/master/rollup.config.js)
- [Turbo stream - WebSockets](https://twitter.com/dunglas/status/1346088916030529537)