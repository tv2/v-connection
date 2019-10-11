import { startPepTalk, LocationType } from '../peptalk'
import * as yargs from 'yargs'

let args = yargs
	.string('host')
	.number('port')
	.string('location')
	.string('sibling')
	.boolean('js')
	.string('_')
	.number('depth')
	.default('host', 'localhost')
	.default('port', 8595)
	.default('location', 'first')
	.demandCommand(2, 2)
	.coerce('location', (l: string): LocationType => {
		switch (l.slice(0, 1).toLowerCase()) {
			case 'f': return LocationType.First
			case 'l': return LocationType.Last
			case 'b': return LocationType.Before
			case 'a': return LocationType.After
			default: return LocationType.First
		}
	})
	.argv

console.dir(args)

async function run () {
	let pt = startPepTalk(args.host, args.port)
	let connected = await pt.connect(true)
	console.log(connected)
	try {
		console.log(await pt.insert(args._[0], args._[1],
			args.location ? args.location : LocationType.First, args.sibling))
	} catch (err) { console.error('!!!', err) }
	await pt.close()
}

run().catch(err => {
	console.error('General error', err)
})
