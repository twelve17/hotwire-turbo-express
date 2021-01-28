import createTag from './create-tag';

/**
 * Class for generating <turbo-stream> HTML snippets in various ways.
 */
export default class TurboStream {
  constructor(attributes, content) {
    if (!attributes) throw new Error('TurboStream: missing attributes');
    this.attributes = attributes;
    this.content = content;
  }

  /**
   * @returns {string} A somewhat pretty formatted HTML <turbo-stream> snippet.
   */
  toHtml() {
    return createTag(this.attributes, this.content, false);
  }

  /**
   * @returns {string} A single SSE "data" message with a single-line HTML <turbo-stream> snippet,
   * with a double-newline suffix.
   */
  toSseMessage() {
    return `data: ${createTag(this.attributes, this.content, true)}\n\n`;
  }

  /**
   * @returns {string} A single-line HTML <turbo-stream> snippet.
   */
  toWebSocketMessage() {
    return createTag(this.attributes, this.content, true);
  }
}
