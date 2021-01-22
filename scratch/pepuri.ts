import { startPepTalk } from '../src/peptalk'
import * as yargs from 'yargs'

const args = yargs
	.string('host')
	.number('port')
	.string('_')
	.alias('_', 'path')
	.coerce('path', (a) =>
		a.reduce((x: string, y: string) => `${x}${x.length === 0 || x.endsWith('/') ? '' : '/'}${y}`, '')
	)
	.default('host', 'localhost')
	.default('port', 8595).argv

console.dir(args)

async function run() {
	const pt = startPepTalk(args.host, args.port)
	const connected = await pt.connect()
	console.log(connected)
	try {
		console.log(await pt.uri(args.path, 'hierarchy_collection'))
	} catch (err) {
		console.dir(err)
	}
	await pt.close()
}

run().catch((err) => {
	console.error('General error', err)
})
