import assert from 'assert';
import request from 'supertest';

import createApp from './app';
import { ACTIONS, MIME_TYPE } from '../src/constants';

describe('turboStream', () => {
  const ACCEPT_HEADERS = {
    turbo: `${MIME_TYPE}, text/html, application/xhtml+xml`,
    html: 'text/html, application/xhtml+xml',
  };

  const CONTENT_TYPES = {
    turbo: new RegExp(MIME_TYPE),
    html: new RegExp('text/html'),
  };

  const formatHtml = (html) => html.replace(/(\n+\s*)/g, '\n').trim();

  const testRequest = (testCase) => request(createApp(testCase)).get('/test');

  describe('#renderViews()', () => {
    describe('with entries in the stream array', () => {
      const testCase = (req, res) => res.turboStream.renderViews([
        {
          stream: {
            action: 'append',
            target: 'list',
          },
          locals: { greeting: 'heyyy' },
          view: 'partials/greeting',
        },
        {
          stream: {
            action: 'replace',
            target: 'button',
          },
          view: 'partials/no-locals',
        },
      ]);

      it('should respond with two turbo streams', async () => {
        const response = await testRequest(testCase)
          .set('Accept', ACCEPT_HEADERS.turbo)
          .expect('Content-Type', CONTENT_TYPES.turbo)
          .expect(200);

        return assert.strictEqual(
          formatHtml(response.text),
          formatHtml(
            `<turbo-stream action="append" target="list">
             <template>
               heyyy, friend!
             </template>
             </turbo-stream>
            <turbo-stream action="replace" target="button">
              <template>
              See ya, friend!
              </template>
            </turbo-stream>
          `,
          ),
        );
      });
    });

    describe('without entries in the stream array', () => {
      const testCase = (req, res) => res.turboStream.renderViews([]);

      it('should respond with an empty body', async () => {
        const response = await testRequest(testCase)
          .set('Accept', ACCEPT_HEADERS.turbo)
          .expect('Content-Type', CONTENT_TYPES.turbo)
          .expect(200);

        return assert.strictEqual(
          formatHtml(response.text),
          '',
        );
      });
    });
  });

  ACTIONS.forEach((action) => {
    describe(`#${action}()`, () => {
      describe('with view locals', () => {
        const view = 'partials/greeting';
        const locals = { greeting: 'howdy' };
        const stream = { target: 'greeting' };

        describe('with default onlyView parameter', () => {
          const testCase = (req, res) => res.format({
            [MIME_TYPE]() {
              return res.turboStream[action](view, locals, stream);
            },
            default() {
              return res.render(view, locals);
            },
          });

          it('should respond to a turbo request', async () => {
            const response = await testRequest(testCase)
              .set('Accept', ACCEPT_HEADERS.turbo)
              .expect('Content-Type', CONTENT_TYPES.turbo)
              .expect(200);

            return assert.strictEqual(
              formatHtml(response.text),
              formatHtml(
                `<turbo-stream target="greeting" action="${action}">
                 <template>
                 howdy, friend!
                 </template>
                 </turbo-stream>`,
              ),
            );
          });

          it('should respond to a non-turbo request', async () => {
            const response = await testRequest(testCase)
              .set('Accept', ACCEPT_HEADERS.html)
              .expect('Content-Type', CONTENT_TYPES.html)
              .expect(200);

            return assert.strictEqual(
              formatHtml(response.text),
              formatHtml(
                'howdy, friend!',
              ),
            );
          });
        });

        describe('with onlyView parameter set to true', () => {
          const testCase = (req, res) => res.turboStream[action](view, locals, stream, true);

          it('should respond to a turbo request', async () => {
            const response = await testRequest(testCase)
              .set('Accept', ACCEPT_HEADERS.turbo)
              .expect('Content-Type', CONTENT_TYPES.turbo)
              .expect(200);

            return assert.strictEqual(
              formatHtml(response.text),
              formatHtml(
                `<turbo-stream target="greeting" action="${action}">
                 <template>
                 howdy, friend!
                 </template>
                 </turbo-stream>`,
              ),
            );
          });

          it('should not respond to a non-turbo request', () => testRequest(testCase)
            .set('Accept', ACCEPT_HEADERS.html)
            .expect('Content-Type', CONTENT_TYPES.html)
            .expect(406));
        });
      });

      describe('without view locals', () => {
        const view = 'partials/no-locals';
        const stream = { target: 'greeting' };
        const locals = undefined;

        const testCase = (req, res) => res.turboStream[action](view, locals, stream, true);

        it('should render response', async () => {
          const response = await testRequest(testCase)
            .set('Accept', ACCEPT_HEADERS.turbo)
            .expect('Content-Type', CONTENT_TYPES.turbo)
            .expect(200);

          return assert.strictEqual(
            formatHtml(response.text),
            formatHtml(
              `<turbo-stream target="greeting" action="${action}">
               <template>
               See ya, friend!
               </template>
               </turbo-stream>`,
            ),
          );
        });
      });

      describe('template with syntax error', () => {
        const view = 'partials/syntax-error';
        const stream = { target: 'greeting' };
        const locals = undefined;

        const testCase = (req, res) => res.turboStream[action](view, locals, stream, true);

        it('should pass error to error middleware', async () => {
          const response = await testRequest(testCase)
            .set('Accept', ACCEPT_HEADERS.turbo)
            .expect('Content-Type', CONTENT_TYPES.html)
            .expect(500);

          return assert.strictEqual(
            formatHtml(response.text),
            formatHtml(
              'Unexpected error: Could not find matching close tag for "<%=".',
            ),
          );
        });
      });
    });
  });
});
