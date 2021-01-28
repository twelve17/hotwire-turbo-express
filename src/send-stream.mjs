import { MIME_TYPE } from './constants';
import notAcceptable from './not-acceptable';

/**
 * @typedef {function} sendStream
 *
 * Convenience function that sends (already rendered) html with the
 * turbo-stream MIME type.
 *
 * @param {object} res - The express response object.
 * @param {string} html - The rendered html.
 * @param {boolean} [onlyFormat=false] - If true, will wrap the response in
 * a "res.format" object, so that the route will _only_ respond to
 * the Turbo mime type, or return a HTTP 406 (Not Acceptable) response.
 * @param {string} [mimeType=MIME_TYPE] - The mime type to
 * use for the Content-Type header. Defaults to value in the
 * constants file.
 */
function sendStream(res, html, onlyFormat, mimeType = MIME_TYPE) {
  if (onlyFormat) {
    return res.format({
      [mimeType]: function turboStreamResponse() {
        return res.send(html);
      },
      default: notAcceptable.bind(res),
    });
  }
  return res.type(mimeType).send(html);
}

export default sendStream;
