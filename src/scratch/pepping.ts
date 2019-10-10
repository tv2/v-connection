import { startPepTalk } from '../peptalk'
import * as yargs from 'yargs'

let args = yargs
	.string('host')
	.number('port')
	.default('host', 'mse_ws.ngrok.io')
	.default('port', 80)
	.argv

async function run () {
	let pt = startPepTalk(args.host, args.port)
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

run().catch(err => {
	console.error('General error', err)
})
