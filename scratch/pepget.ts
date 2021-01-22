import { startPepTalk } from '../src/peptalk'
import * as yargs from 'yargs'

const args = yargs
	.string('host')
	.number('port')
	.boolean('js')
	.string('_')
	.alias('_', 'path')
	.coerce('path', (a) =>
		a.reduce((x: string, y: string) => `${x}${x.length === 0 || x.endsWith('/') ? '' : '/'}${y}`, '')
	)
	.number('depth')
	.default('host', 'localhost')
	.default('port', 8595)
	.default('depth', undefined)
	.default('js', false).argv

console.dir(args)

async function run() {
	const pt = startPepTalk(args.host, args.port)
	const connected = await pt.connect()
	console.log(connected)
	try {
		if (args.js) {
			console.dir(await pt.getJS(args.path, args.depth), { depth: 10 })
		} else {
			console.log(await pt.get(args.path, args.depth))
		}
	} catch (err) {
		console.error('!!!', err)
	}
	await pt.close()
}

run().catch((err) => {
	console.error('General error', err)
})
