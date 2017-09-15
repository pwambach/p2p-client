import {EventEmitter} from 'events';
import Signaling from './Signaling';

export default class WebARStreamer extends EventEmitter {
  constructor() {
    super();

    this.signaling = new Signaling('wss://p2p-signaling-server.now.sh');
    this.id = this.signaling.id;
    this.signaling.on('open', ({id}) => {
      this.id = id;
      this.emit('ready');
    });
    this.signaling.on('signal', this.onSignal.bind(this));

    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun://stun.l.google.com:19305'
        }
      ]
    });

    this.peer.onicecandidate = event => {
      const {candidate} = event;

      if (!candidate || !this.targetId) {
        return;
      }

      this.signaling.send(this.targetId, {
        type: 'candidate',
        candidate
      });
    };

    this.peer.ondatachannel = event => {
      this.channel = event.channel;
      this.channel.onopen = () => this.onChannelReadyState();
      this.channel.onclose = () => this.onChannelReadyState();
      this.channel.onmessage = message => this.onChannelMessage(message);

      setInterval(() => this.channel.send(new Float32Array(100)), 1000);
    };
  }

  onSignal({signal, sourceId}) {
    this.targetId = sourceId;
    const {type, offer, answer, candidate} = signal;

    switch (type) {
      case 'offer':
        this.peer
          .setRemoteDescription(offer)
          .then(() => this.peer.createAnswer())
          .then(localAnswer => {
            this.signaling.send(this.targetId, {
              type: 'answer',
              answer: localAnswer
            });
            return localAnswer;
          })
          .then(localAnswer => this.peer.setLocalDescription(localAnswer))
          .catch(error =>
            console.warn('WebARStreamer Error (receive offer):', error)
          );
        break;

      case 'answer':
        this.peer.setRemoteDescription(answer);
        break;

      case 'candidate':
        this.peer
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error =>
            console.warn('WebARStreamer Error (add candidate):', error)
          );
    }
  }

  connect(targetId) {
    if (!this.id) {
      console.warn('WebARStreamer Error (not ready)');
      return;
    }

    this.targetId = targetId;

    this.channel = this.peer.createDataChannel('pose', {
      ordered: false,
      reliable: false
    });
    this.channel.binaryType = 'arraybuffer';
    this.channel.onopen = () => this.onChannelReadyState();
    this.channel.onclose = () => this.onChannelReadyState();
    this.channel.onmessage = message => this.onChannelMessage(message);

    this.peer
      .createOffer()
      .then(offer => {
        this.peer.setLocalDescription(offer);
        this.signaling.send(this.targetId, {type: 'offer', offer});
      })
      .catch(error => console.warn('WebARStreamer Error (send offer):', error));
  }

  onChannelReadyState() {
    const {readyState} = this.channel;
    console.log('WebARStreamer Channel readystate:', readyState);
  }

  onChannelMessage(message) {
    this.emit('data', message.data);
  }
}
