const request = require("request-promise-native");
const ws = require('ws');
const xml2js = require('xml2js');

let webby = new ws('ws://mse_ws.ngrok.io/');

let thingy = `/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/mastertemplates/${process.argv[2]}`

let counter = 1;
let pending = {};
let parser = new xml2js.Parser();

let failTimer = (t, c) => new Promise((resolve, reject) => {
	setTimeout(() => {
		reject(new Error(`Parallel promise to send message ${c} did not resolve in time.`));
	}, t);
})

function send (m) {
	let c = counter++;
	return Promise.race([
		failTimer(1000, c),
		new Promise((resolve, reject) => {
			webby.send(`${c} ${m}\r\n`);
			pending[`${c}`] = { resolve, reject };
		})
	])
}

webby.on('open', async () => {
  console.log('Open');
  let res = await send('protocol peptalk noevents');
  console.log(res);
	res = await send(`get {${thingy.length}}${thingy}`);
	let firstCloseBrace = res.indexOf('}');
	let json = await parser.parseStringPromise(res.slice(firstCloseBrace + 1));
	console.dir(json, { depth: 10 });

	res = await send(`get {${thingy.length}}${thingy}`);
	firstCloseBrace = res.indexOf('}');
	json = await parser.parseStringPromise(res.slice(firstCloseBrace + 1));
	console.dir(json, { depth: 10 });

	webby.close();
});

webby.on('upgrade', () => {
  console.log('Upgrade 1');
});


webby.on('message', m => {
	let firstSpace = m.indexOf(' ');
	if (firstSpace <= 0) return;
	// console.log(firstSpace, pending, m.slice(0, firstSpace));
	if (pending[m.slice(0, firstSpace)]) {
		pending[m.slice(0, firstSpace)].resolve(m);
	}
});

process.on('SIGHUP', webby.close);
