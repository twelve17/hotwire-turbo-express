# hotwire-turbo-express

ExpressJS middleware for <a href="https://hotwire.dev/">hotwire</a> <a href="https://turbo.hotwire.dev/">Turbo</a> streams.

# Requirements

Node 14.x or environment supporting ESM and optional chaining.

# Installation

```
npm i hotwire-turbo-express
```

# TODO

- Websockets
- supertest

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

## Setup

```
cd example-app
npm run install-dist
npm i
```

## Running
```
npm run start
```

Browse to http://localhost:3000