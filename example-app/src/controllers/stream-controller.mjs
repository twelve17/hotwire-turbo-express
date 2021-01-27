/* eslint-disable no-console */
import { Controller } from 'stimulus';
import { connectStreamSource, disconnectStreamSource } from '@hotwired/turbo';

export default class extends Controller {
  connect() {
    // can be relative
    const url = this.element.getAttribute('data-sse-source');
    if (url) {
      // server-side events (SSE, not WebSocket) endpoint
      this.es = new EventSource(url);
      console.log('Established server-side event (SSE) stream source at url:', url);

      this.es.onmessage = function handleMessage(event) {
        console.log('SSE: got message:', event.data);
      };
    } else {
      const wsUrl = this.element.getAttribute('data-ws-source');
      this.es = new WebSocket(wsUrl);
      console.log('Established WebSocket stream source at url:', wsUrl);
      this.es.onmessage = function handleMessage(message) {
        console.log('WS: got message:', message);
      };
    }

    connectStreamSource(this.es);
  }

  disconnect() {
    console.log('Disconnection stream source');
    this.es.close();
    disconnectStreamSource(this.es);
  }
}
