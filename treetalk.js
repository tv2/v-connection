const ws = require('ws')

let webby2 = new ws('ws://192.168.1.3:8595');

webby2.on('open', () => {
  console.log('Open 2');
  webby2.send('1 protocol treetalk schedule\n\n');
});

webby2.on('upgrade', () => {
  console.log('Upgrade 2');
});

webby2.on('message', m => { if (m.indexOf('/scheduler status') < 0) console.log('message2:', m) });

setTimeout(() => {
  console.log('The end');
  webby2.close();
}, 200000);

/* 20 schedule {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 {0}
     schedule 0 {0} profile /config/profiles/MOSART viz {5}Viz A command out show {62}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements */


process.on('SIGHUP', webby2.close);
