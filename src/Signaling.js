import {EventEmitter} from 'events';

const PROTOCOL = 'webrtc-cutom-3425415';

export default class Signaling extends EventEmitter {
  constructor(url, protocol = PROTOCOL) {
    super();

    this.id = Math.round(Math.random() * 1000).toString();

    this.ws = new WebSocket(url, protocol);
    this.ws.onmessage = () => this.onMessage();
    this.ws.onerror = onError;
    this.ws.onclose = onClose;
    this.ws.onopen = () => {
      this.emit('open', {id: this.id});
      const message = {type: 'register', payload: {id: this.id}};
      this.ws.send(JSON.stringify(message));
    };
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
    console.log('onmessage', signal);
    const {source, target} = signal;

    if (target !== this.id) {
      console.log(`Signaling: Wrong target id (${target})`);
      return;
    }

    delete signal.source;
    delete signal.target;

    this.emit('signal', {signal, sourceId: source});
  }
}

function onError(event) {
  console.error('Signaling: Connection error: ', event);
}

function onClose() {
  console.log('Signaling: Connection closed');
}
