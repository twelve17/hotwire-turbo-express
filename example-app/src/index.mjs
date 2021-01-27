// import * as Turbo from '@hotwired/turbo';
import { Application } from 'stimulus';
import StreamController from './controllers/stream-controller.mjs';

const startStimulusApp = () => {
  const application = Application.start();
  application.register('stream', StreamController);
};

startStimulusApp();

/*
const addTurboListeners = () => {
  // eslint-disable-next-line no-undef
  document.addEventListener('turbo:click', (event) => {
    console.log('turbo:click', event);
  });

  // eslint-disable-next-line no-undef
  document.addEventListener('turbo:submit', (event) => {
    console.log('turbo:submit', event);
  });
};
*/
