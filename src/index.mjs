import { promisify } from 'util';
import { sendStream } from './send-stream';
import TurboStream from './turbo-stream';

export const MIME_TYPE = 'text/vnd.turbo-stream.html';

export const ACTIONS = ['append', 'prepend', 'replace', 'update'];

/**
 * @typedef {object} TurboStreamSpec
 *
 * Object with necessary properties to render a view with optional variables
 * and wrap it in a <turbo-stream> tag.
 *
 * @property {object} stream - Attributes to set in the <turbo-stream>
 * tag.
 * @property {string} view - Path to the view to render inside
 * the <turbo-stream> tag.
 * @property {object} [variables] - Variables to pass on to the view,
 * in the same format as is done for req.render.
 *
 * @example
 * <pre>
 * res.turboStream.compileViews(
 *  [
 *    {
 *      stream: {
 *        action: 'append',
 *        target: 'item-list',
 *      },
 *      variables: { items, cursor: nextCursor },
 *      view: 'item-list/partials/item-list',
 *    },
 *    {
 *      stream: {
 *        action: 'replace',
 *        target: 'item-list-more-button',
 *      },
 *      variables: { cursor: nextCursor, hasMore },
 *      view: 'item-list/partials/item-list-more-button',
 *    },
 *   ],
 *   true
 * );
 * </pre>
 *
 */

/**
 * Turbo stream middleware factory function.
 *
 * @param {string} mimeType - The mime type to check for in the
 * HTTP Accept header, to detect the presence of a request made
 * by the Turbo client, as well as the type to send in the
 * Content-Type header, in response to such requests.
 *
 * @return {turboStream} Turbo stream middleware.
 */
const turboStream = (mimeType = MIME_TYPE, promiseRender) => (_req, res, next) => {
  const render = promiseRender || promisify(res.render).bind(res);

  /**
  * @typedef {function} compileView
  *
  * Function for compiling a single view template into a turbo-stream
  * HTML snippet.
  *
  * @param {TurboStreamSpec} spec - an object conforming to TurboStreamSpec type.
  *
  * @return {String} - HTML containing a the rendered view, wrapped in
  * a <turbo-stream> tag,
  */
  const compileView = async ({ stream, view, variables }) => {
    if (!stream) throw new Error('compileView: missing stream');
    if (!view) throw new Error('compileView: missing view');
    const compiledView = await render(view, variables);
    return new TurboStream(stream, compiledView).toHtml();
  };

  /**
  * @typedef {function} compileViews
  *
  * Function for compiling multiple view templates into turbo-streams
  *
  * @param {Array<TurboStreamSpec>} specs - an object conforming to TurboStreamSpec type.
  *
  * @return {String} - HTML containing a set of <turbo-stream> tags,
  * each wrapping one of the views provided. Tags are separated by a
  * newline (\n).
  */
  const compileViews = async (specs) => {
    const compiledViews = await Promise.all((specs || []).map(compileView));
    return compiledViews.join('\n');
  };

  async function renderViews(specs, onlyFormat) {
    try {
      const html = await compileViews(specs);
      return sendStream(this, html, onlyFormat, mimeType);
    } catch (error) {
      return next(error);
    }
  }

  async function renderView(spec, onlyFormat) {
    try {
      const html = await compileView(spec);
      const result = await sendStream(res, html, onlyFormat, mimeType);
      return result;
    } catch (error) {
      return next(error);
    }
  }

  /**
  * @typedef {function} renderActionView
  *
  * Function which will render a response with the a given
  * template and variables, wrapped in a <turbo-stream> tag.
  *
  streams, onlyFormat = false

  * @param {Array<TurboStreamSpec>} streams - Array of stream specifications.
  * @param {boolean} [onlyFormat=false] - If true, will wrap the response in
  * a "res.format" object, so that the route will _only_ respond to
  * the Turbo mime type, or return a HTTP 406 (Not Acceptable) response.
  */
  async function renderActionView({ action, onlyFormat = false, spec }) {
    const stream = { ...(spec.stream || {}), action };
    return renderView({ ...spec, stream }, onlyFormat);
  }

  const actionFunctions = ACTIONS.reduce((acc, action) => {
    acc[action] = async function turboAction(view, variables, stream, onlyFormat) {
      if (!stream) throw new Error(`turboStream.${action}: missing stream attributes.`);
      const spec = { view, variables, stream };
      return renderActionView({ action, onlyFormat, spec });
    };
    return acc;
  }, {});

  /**
  * @typedef {object} turboStream middleware.
  *
  * Middleware which decorates the express response object with a
  * "turboStream" object, with the following properties:
  *
  * @property {renderActionView} append - Function to generate a
  * turbo stream with the "append" action.
  * @property {renderActionView} prepend - Function to generate a
  * turbo stream with the "prepend" action.
  * @property {renderActionView} replace - Function to generate a
  * turbo stream with the "replace" action.
  * @property {renderActionView} update - Function to generate a
  * turbo stream with the "update" action.
  * @property {compiledView} compileView - See compileView jsdoc.
  * @property {compiledViews} compileViews - See compileViews jsdoc.
  * @property {sendStream} sendStream - See sendStream jsdoc.
  * @property {class} TurboStream- See TurboStream jsdoc.
  */
  res.turboStream = {
    mimeType,
    compileView,
    compileViews,
    renderView: renderView.bind(res),
    renderViews: renderViews.bind(res),
    sendStream,
    TurboStream,
    ...actionFunctions,
  };

  next();
};

export default turboStream;
