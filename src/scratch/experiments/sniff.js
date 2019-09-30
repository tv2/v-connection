const ws = require('ws')

let webby = new ws('ws://192.168.1.3:8595');

webby.on('open', () => {
  console.log('Open');
  webby.send('1 protocol peptalk\n\n');
});

webby.on('upgrade', () => {
  console.log('Upgrade');
});

webby.on('message', m => { console.log('message:', m) });

setTimeout(() => {
  console.log('The end');
  webby.close();
}, 20000000);

process.on('SIGHUP', webby.close);
