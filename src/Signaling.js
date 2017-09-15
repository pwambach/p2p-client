import {EventEmitter} from 'events';

const PROTOCOL = 'webrtc-custom-signaling';
let DEBUG = false;

export default class Signaling extends EventEmitter {
  constructor(url, protocol = PROTOCOL, debug = false) {
    super();

    this.id = Math.round(Math.random() * 100000).toString();

    this.ws = new WebSocket(url, protocol);
    this.ws.onmessage = () => this.onMessage();
    this.ws.onerror = onError;
    this.ws.onclose = onClose;
    this.ws.onopen = () => {
      this.emit('open', {id: this.id});
      const message = {type: 'register', payload: {id: this.id}};
      this.ws.send(JSON.stringify(message));
    };

    DEBUG = debug;
  }

  send(targetId, message) {
    const payload = Object.assign({}, message, {
      target: targetId,
      source: this.id
    });
    const signal = {type: 'signal', payload};
    this.ws.send(JSON.stringify(signal));
  }

  onMessage() {
    const signal = JSON.parse(event.data);
    const {source, target} = signal;

    if (target !== this.id) {
      log(`Signaling: Wrong target id (${target})`);
      return;
    }

    delete signal.source;
    delete signal.target;

    this.emit('signal', {signal, sourceId: source});
  }
}

function onError(event) {
  error('Signaling: Connection error: ', event);
}

function onClose() {
  log('Signaling: Connection closed');
}

function log(message) {
  if (DEBUG) {
    console.log(message);
  }
}

function error(message) {
  if (DEBUG) {
    console.error(message);
  }
}
