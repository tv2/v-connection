const request = require('request-promise-native')
const ws = require('ws')
const xml2js = require('xml2js')

let webby = new ws('ws://mse_ws.ngrok.io/')

let counter = 1
let pending = {}

let failTimer = (t, c) =>
	new Promise((resolve, reject) => {
		setTimeout(() => {
			reject(new Error(`Parallel promise to send message ${c} did not resolve in time.`))
		}, t)
	})

function send(m) {
	let c = counter++
	return Promise.race([
		failTimer(3000, c),
		new Promise((resolve, reject) => {
			webby.send(`${c} ${m}\r\n`)
			pending[`${c}`] = { resolve, reject }
		}),
	])
}

let parser = new xml2js.Parser()

webby.on('open', async () => {
	console.log('Open')
	try {
		let res = await send('protocol peptalk noevents')
		console.log(res)
		res = await send(`get {69}/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/mastertemplates 1`)
		console.log(res)
		let json = await parser.parseStringPromise(res.slice(11))
		console.dir(
			json.entry.element.map((x) => x.$.name),
			{ depth: 10 }
		)
	} catch (err) {
		console.error(err)
	} finally {
		webby.close()
	}
})

webby.on('upgrade', () => {
	console.log('Upgrade 1')
})

webby.on('message', (m) => {
	let firstSpace = m.indexOf(' ')
	if (firstSpace <= 0) return
	if (pending[m.slice(0, firstSpace)]) {
		pending[m.slice(0, firstSpace)].resolve(m)
	}
})

process.on('SIGHUP', webby.close)
