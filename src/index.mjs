import escape from 'escape-html';
import { promisify } from 'util';
import { notAcceptable } from './not-acceptable';

export const MIME_TYPE = 'text/vnd.turbo-stream.html';

const ACTIONS = ['append', 'prepend', 'replace', 'update'];

const buildAttributes = (attributes) => Object.keys(attributes || {})
  .map((name) => [name, `"${escape(attributes[name])}"`].join('='))
  .join(' ');

const buildStreamFragment = (attributes, content) => `
  <turbo-stream ${buildAttributes(attributes)}>
    <template>
      ${content}
    </template>
  </turbo-stream>
`;

const renderViewAsStreamFactory = (renderDelegate) => async (streamSpec) => {
  const { view, variables, stream } = streamSpec;
  const renderedView = await renderDelegate(view, variables);
  return buildStreamFragment(stream, renderedView);
};

export function sendViewStream(res, body, onlyFormat, mimeType = MIME_TYPE) {
  if (onlyFormat) {
    return res.format({
      [mimeType]: function turboStreamResponse() {
        return res.send(body);
      },
      default: notAcceptable.bind(res),
    });
  }
  return res.type(mimeType).send(body);
}

/**
 * @typedef {object} StreamSpec
 * @property {object} stream - Attributes to set in the <turbo-stream>
 * tag.
 * @param {string} view - Path to the view view to render inside
 * the <turbo-stream> tag.
 * @param {object} variables - Variables to pass on to the view,
 * in the same format as is done for req.render.
 *
 * @example
 * <pre>
 * res.turboStream.renderViews(
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
 * @typedef {function} TurboSingleStreamActionFunction
 *
 * Function which will render a response with the a given
 * template and variables, wrapped in a <turbo-stream> tag.
 *
 streams, onlyFormat = false

 * @param {Array<StreamSpec>} streams - Array of stream specifications.
 * @param {boolean} [onlyFormat=false] - If true, will wrap the response in
 * a "res.format" object, so that the route will _only_ respond to
 * the Turbo mime type, or return a HTTP 406 (Not Acceptable) response.
 */

/**
 * @typedef {function} TurboMultipleStreamActionFunction
 *
 * Function for sending multiple view templates, each getting
 * wrapped in its own <turbo-stream> tag.
 *
 * @param {string} view - Path to the view view to render inside
 * the <turbo-stream> tag.
 * @param {object} variables - Variables to pass on to the view,
 * in the same format as is done for req.render.
 * @param {object} stream - Attributes to set in the <turbo-stream>
 * tag. Note that "action" here will be ignored, as it will be set
 * by the function itself.
 * @param {boolean} [onlyFormat=false] - If true, will wrap the response in
 * a "res.format" object, so that the route will _only_ respond to
 * the Turbo mime type, or return a HTTP 406 (Not Acceptable) response.
 */

/**
 * @typedef {object} turboStream middleware.
 *
 * Middleware which decorates the express response object with a
 * "turboStream" object.
 *
 * @property {TurboSingleStreamActionFunction} append - Function to generate a
 * turbo stream with the "append" action.
 * @property {TurboSingleStreamActionFunction} prepend - Function to generate a
 * turbo stream with the "prepend" action.
 * @property {TurboSingleStreamActionFunction} replace - Function to generate a
 * turbo stream with the "replace" action.
 * @property {TurboSingleStreamActionFunction} update - Function to generate a
 * turbo stream with the "update" action.
 * @property {TurboMultipleStreamActionFunction} renderViews - Function to
 * generate multiple turbo streams in a single response.
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
const turboStream = (mimeType = MIME_TYPE) => (_req, res, next) => {
  const render = promisify(res.render).bind(res);
  const renderViewAsStream = renderViewAsStreamFactory(render);

  async function renderViews(streams, onlyFormat = false) {
    const compiledStreams = await Promise.all(
      (streams || []).map(renderViewAsStream),
    );
    const output = compiledStreams.join('\n');
    const result = await sendViewStream(res, output, onlyFormat, mimeType);
    return result;
  }

  res.turboStream = ACTIONS.reduce((acc, action) => {
    acc[action] = async function turboAction(view, variables, attr, onlyFormat = false) {
      const stream = { ...(attr || {}), action };
      try {
        const output = await renderViewAsStream({ variables, view, stream });
        const result = await sendViewStream(res, output, onlyFormat, mimeType);
        return result;
      } catch (error) {
        return next(error);
      }
    };
    return acc;
  }, {});
  res.turboStream.renderViews = renderViews.bind(res);
  res.turboStream.mimeType = mimeType;

  next();
};

export default turboStream;
