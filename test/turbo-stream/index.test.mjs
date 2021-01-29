import assert from 'assert';
import TurboStream from '../../src/turbo-stream';

describe('TurboStream', () => {
  const attributes = {
    action: 'append',
    target: 'list',
  };

  const content = 'Hey now';

  const obj = new TurboStream(
    attributes,
    content,
  );

  describe('#constructor()', () => {
    it('sets attributes', (done) => {
      assert.strictEqual(obj.attributes, attributes);
      assert.strictEqual(obj.content, content);
      done();
    });
  });

  describe('#toHtml()', () => {
    it('creates a html snippet', (done) => {
      assert.strictEqual(obj.toHtml(),
        '\n  <turbo-stream action="append" target="list">\n    <template>\n      Hey now\n    </template>\n  </turbo-stream>\n');
      done();
    });
  });

  describe('#toSseMessage()', () => {
    it('creates a single line html snippet', (done) => {
      assert.strictEqual(obj.toSseMessage(),
        'data: <turbo-stream action="append" target="list">    <template>      Hey now    </template>  </turbo-stream>\n\n');
      done();
    });
  });

  describe('#toWebSocketMessage()', () => {
    it('creates a single line html snippet', (done) => {
      assert.strictEqual(obj.toWebSocketMessage(),
        '<turbo-stream action="append" target="list">    <template>      Hey now    </template>  </turbo-stream>');
      done();
    });
  });
});
