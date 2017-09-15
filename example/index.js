import WebARStreamer from '../src/WebARStreamer';

const streamer = new WebARStreamer();
console.log('Local Id: ', streamer.id);

if (window.location.search.includes('init')) {
  streamer.on('ready', () => {
    console.log('READY');
    streamer.connect('242');
  });
}

streamer.on('data', data => console.log('incoming data', data));
