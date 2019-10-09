import { PepTalk } from '../peptalk'

async function run () {
	let pt = new PepTalk('mse_ws.ngrok.io', 80)
	try {
		await pt.get('/', 0)
	} catch (err) {
		console.error(err)
	}
	let connected = await pt.connect()
	console.log(connected)
	try {
		console.log(await pt.ping())
	} catch (err) { console.error('!!!', err) }
	await pt.close()
	await pt.get('/', 0).catch(console.error)
}

run()
