import P2PClient from '../src/p2p-client';

const p2p = new P2PClient();
console.log('Local Id: ', p2p.id);

if (window.location.search.includes('init')) {
  p2p.on('ready', () => {
    console.log('READY');
    p2p.connect('48006');
  });
}

p2p.on('data', data => console.log('incoming data', data));
