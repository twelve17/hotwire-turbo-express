/* eslint-disable no-console */
import { Controller } from 'stimulus';
import { connectStreamSource, disconnectStreamSource } from '@hotwired/turbo';

export default class extends Controller {
  connect() {
    // can be relative
    const url = this.element.getAttribute('data-stream-source');
    if (!url) {
      console.log('Stream controller connected without a stream source.');
      return;
    }

    if (url.startsWith('ws')) {
      this.es = new WebSocket(url);
      console.log('Established WebSocket stream source at url:', url);
      this.es.onmessage = function handleMessage(message) {
        console.log('WS: got message:', message);
      };
    } else {
      // server-side events (SSE, not WebSocket) endpoint
      this.es = new EventSource(url);
      console.log('Established server-side event (SSE) stream source at url:', url);

      this.es.onmessage = function handleMessage(event) {
        console.log('SSE: got message:', event.data);
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
