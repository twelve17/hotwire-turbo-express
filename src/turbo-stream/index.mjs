import { promisify } from 'util';
import createTag from './create-tag';

export default class TurboStream {
  constructor(attributes, content) {
    if (!attributes) throw new Error('TurboStream: missing attributes');
    this.attributes = attributes;
    this.content = content;
  }

  static expressRenderer(res) {
    return promisify(res.render).bind(res);
  }

  static async fromExpressView(attributes, res, view, variables) {
    const content = await this.expressRenderer(res)(view, variables);
    return new TurboStream(attributes, content);
  }

  toHtml() {
    return createTag(this.attributes, this.content, false);
  }

  toWebSocketMessage() {
    return createTag(this.attributes, this.content, true);
  }

  toSseMessage() {
    return `data: ${createTag(this.attributes, this.content, true)}\n\n`;
  }
}
