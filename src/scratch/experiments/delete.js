const request = require("request-promise-native");
const ws = require('ws');

let webby = new ws('ws://mse_ws.ngrok.io/');

let counter = 1;
let pending = {};

let failTimer = (t, c) => new Promise((resolve, reject) => {
	setTimeout(() => {
		reject(new Error(`Parallel promise to send message ${c} did not resolve in time.`));
	}, t);
})

function send (m) {
	let c = counter++;
	return Promise.race([
		failTimer(3000, c),
		new Promise((resolve, reject) => {
			webby.send(`${c} ${m}\r\n`);
			pending[`${c}`] = { resolve, reject };
		})
	])
}

webby.on('open', async () => {
  console.log('Open');
	try {
	  let res = await send('protocol peptalk noevents');
	  console.log(res);
		res = await send(`delete {82}/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/elements/BUILT_BY_SUPERFLY#2`);
		console.log(res);
	} catch (err) {
		console.error(err);
	} finally {
		webby.close();
	}
});

webby.on('upgrade', () => {
  console.log('Upgrade 1');
});


webby.on('message', m => {
	let firstSpace = m.indexOf(' ');
	if (firstSpace <= 0) return;
	if (pending[m.slice(0, firstSpace)]) {
		pending[m.slice(0, firstSpace)].resolve(m);
	}
});

process.on('SIGHUP', webby.close);
