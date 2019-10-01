const request = require("request-promise-native");
const ws = require('ws');

let webby = new ws('ws://1d8dab0e.ngrok.io/');

let change = `<entry name="data">
    <entry name="20">${process.argv[2]}</entry>
    <entry name="21">${process.argv[3]}</entry>
</entry>`;

webby.on('open', () => {
  console.log('Open 1');
  webby.send('1 protocol peptalk noevents\n\n');
  webby.send(`2 get {76}/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/elements/SUPERFLY/data\n\n`)
  webby.send(`3 replace {76}/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/elements/SUPERFLY/data {${change.length}}${change}\n\n`);

  setTimeout(() => {
    request.post({
      method: 'POST',
      uri: 'http://62918c05.ngrok.io/profiles/MOSART/take',
      body: '/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/elements/SUPERFLY'
    });
		console.log('>>> Take requested');
  }, 500);

  setTimeout(() => {
    request.post({
      method: 'POST',
      uri: 'http://62918c05.ngrok.io/profiles/MOSART/out',
      body: '/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/elements/SUPERFLY'
    });
		console.log('>>> Out requested');
  }, 10500);
});

webby.on('upgrade', () => {
  console.log('Upgrade 1');
});

webby.on('message', m => console.log('>>>', m));

process.on('SIGHUP', webby.close);
