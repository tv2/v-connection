import { startPepTalk } from '../peptalk'
import * as yargs from 'yargs'

let args = yargs
	.string('host')
	.number('port')
	.string('_')
	.alias('_', 'path')
	.coerce('path', a => a.reduce(
		(x: string, y: string) => `${x}${x.length === 0 || x.endsWith('/') ? '' : '/'}${y}`, ''))
	.number('depth')
	.default('host', 'mse_ws.ngrok.io')
	.default('port', 80)
	.default('depth', undefined)
	.argv

console.dir(args)

async function run () {
	let pt = startPepTalk(args.host, args.port)
	let connected = await pt.connect()
	console.log(connected)
	try {
		console.log(await pt.get(args.path, args.depth))
	} catch (err) { console.error('!!!', err) }
	await pt.close()
}

run().catch(err => {
	console.error('General error', err)
})
