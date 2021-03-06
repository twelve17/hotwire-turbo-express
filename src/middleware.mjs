import { promisify } from 'util';
import { ACTIONS, MIME_TYPE } from './constants';
import sendStream from './send-stream';
import TurboStream from './turbo-stream/index';

/**
 * @typedef {object} TurboStreamSpec
 *
 * Object with necessary properties to render a view with optional locals
 * and wrap it in a <turbo-stream> tag.
 *
 * @property {object} stream - Attributes to set in the <turbo-stream>
 * tag.
 * @property {string} view - Path to the view to render inside
 * the <turbo-stream> tag.
 * @property {object} [locals] - locals to pass on to the view,
 * in the same format as is done for req.render.
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
  const compileView = async ({ stream, view, locals }) => {
    if (!stream) throw new Error('compileView: missing stream');
    if (!view) throw new Error('compileView: missing view');
    const compiledView = await render(view, locals);
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
  *      locals: { items, cursor: nextCursor },
  *      view: 'item-list/partials/item-list',
  *    },
  *    {
  *      stream: {
  *        action: 'replace',
  *        target: 'item-list-more-button',
  *      },
  *      locals: { cursor: nextCursor, hasMore },
  *      view: 'item-list/partials/item-list-more-button',
  *    },
  *   ],
  *   true
  * );
  * </pre>
  *
  */
  const compileViews = async (specs) => {
    const compiledViews = await Promise.all((specs || []).map(compileView));
    return compiledViews.join('\n');
  };

  /**
  * @typedef {function} renderViews
  *
  * Convenience function that calls compileViews() then sendStream()
  * with the results.
  *
  * @param {Array<TurboStreamSpec>} specs - an object conforming to TurboStreamSpec type.
  *
  */
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

  async function renderActionView({ action, onlyFormat = false, spec }) {
    const stream = { ...(spec.stream || {}), action };
    return renderView({ ...spec, stream }, onlyFormat);
  }

  const actionFunctions = ACTIONS.reduce((acc, action) => {
    /**
    * @typedef {function} turboAction
    *
    * Function which will render a response with the a given
    * template and locals, wrapped in a <turbo-stream> tag.
    *
    * @param {string} view - Path to the view to render inside
    * the <turbo-stream> tag.
    * @param {object} [locals] - locals to pass on to the view,
    * in the same format as is done for req.render.
    * @param {object} stream - Attributes to set in the <turbo-stream> tag.
    * @param {boolean} [onlyFormat=false] - If true, will wrap the response in
    * a "res.format" object, so that the route will _only_ respond to
    * the Turbo mime type, or return a HTTP 406 (Not Acceptable) response.
    */
    async function turboAction(view, locals, stream, onlyFormat) {
      if (!stream) throw new Error(`turboStream.${action}: missing stream attributes.`);
      const spec = { view, locals, stream };
      return renderActionView({ action, onlyFormat, spec });
    }
    acc[action] = turboAction;
    return acc;
  }, {});

  /**
  * @typedef {object} turboStream middleware.
  *
  * Middleware which decorates the express response object with a
  * "turboStream" object, with the following properties:
  *
  * @property {turboAction} append - Function to generate a
  * turbo stream with the "append" action.
  * @property {turboAction} prepend - Function to generate a
  * turbo stream with the "prepend" action.
  * @property {turboAction} replace - Function to generate a
  * turbo stream with the "replace" action.
  * @property {turboAction} update - Function to generate a
  * turbo stream with the "update" action.
  * @property {compiledView} compileView - See compileView jsdoc.
  * @property {compiledViews} compileViews - See compileViews jsdoc.
  * @property {sendStream} sendStream - See sendStream jsdoc.
  * @property {class} TurboStream - See TurboStream jsdoc.
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
