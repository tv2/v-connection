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

async function convertTemplate (source) {
	let t = source.element;
	for ( let k in t.$ ) {
		t[k] = t.$[k];
	}
	delete t.$;
	for ( let e of t.entry ) {
		t[e.$.name] = e._ ? e._ : e;
		delete e.$;
	}
	delete t.entry;
	if (t.model_xml) {
		let mxml = await parser.parseStringPromise(t.model_xml);
		if (mxml.model && mxml.model.schema && mxml.model.schema[0] && mxml.model.schema[0].fielddef ) {
			t.model_xml = mxml.model.schema[0].fielddef.map(x => {
				for ( let k in x.$ ) {
					x[k] = x.$[k];
				}
				delete x.$;
				x.value = x.value[0];
				x.container = x.container[0].$;
				if (x.container.xmlns) { delete x.container.xmlns; }
				for ( let k in x ) {
					if (Array.isArray(x[k]) && x[k][0] && x[k][0].$ && x[k][0].$.xmlns &&
					  Object.keys(x[k][0].$).length === 1) {
							x[k] = true;
						}
				}
				return x;
			});
		} else {
			t.model_xml = {};
		}

	}
	return t;
}

webby.on('open', async () => {
  console.log('Open');
	try {
	  let res = await send('protocol peptalk noevents');
	  console.log(res);
		res = await send(`get {${thingy.length}}${thingy}`);
		let firstCloseBrace = res.indexOf('}');
		let json = await parser.parseStringPromise(res.slice(firstCloseBrace + 1));
		// console.dir(json, { depth: 10 });
		let t = await convertTemplate(json);
		console.dir(t, { depth: 10 });
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
	// console.log(firstSpace, pending, m.slice(0, firstSpace));
	if (pending[m.slice(0, firstSpace)]) {
		pending[m.slice(0, firstSpace)].resolve(m);
	}
});

process.on('SIGHUP', webby.close);
