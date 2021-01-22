const request = require("request-promise-native");
const ws = require('ws');
const xml2js = require('xml2js');

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

let element = {
	element: {
		$: {
			available : '1.00',
			creator: 'Sofie',
			description: 'Sofie made this',
			guid: '2019-10-02T17:06:34Z_od-triotravel03.tv2.local_7654_0',
			loaded: '0.00',
			take_count: '0',
			updated: '2019-09-27T09:06:34Z',
			name: 'BUILT_BY_SUPERFLY'
		},
		ref: {
			$: { name: 'master_template' },
			_: '/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/mastertemplates/direkte'
		},
		entry: [
			{ $: { name: 'default_alternatives' } },
			{ $: { name: 'data'},
			 	entry: [ {
					$: { name: '06' },
					_: 'Ormiscaig'
				} ]
			}
		] }
};

console.dir(element, { depth: 10 });

let builder = new xml2js.Builder({ headless: true });
let xml = builder.buildObject(element);

console.log(xml);

webby.on('open', async () => {
  console.log('Open');
	try {
	  let res = await send('protocol peptalk noevents');
	  console.log(res);
		res = await send(`insert {80}/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/elements/BUILT_BY_SUPERFLY last {${xml.length}}${xml}`);
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
