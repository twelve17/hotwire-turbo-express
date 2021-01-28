import { notAcceptable } from './not-acceptable';

export const MIME_TYPE = 'text/vnd.turbo-stream.html';

export function sendStream(res, html, onlyFormat, mimeType = MIME_TYPE) {
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
