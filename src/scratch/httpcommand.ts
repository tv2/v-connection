import { createHTTPContext } from '../msehttp'
import * as yargs from 'yargs'

let args = yargs
	.string('profile')
	.string('host')
	.number('port')
	.demandCommand(2, 2)
	.default('profile', 'MOSART')
	.default('host', 'localhost')
	.default('port', 8580)
	.argv

async function run () {
	try {
		let http = createHTTPContext(args.profile, args.host, args.port)
		let start = process.hrtime()
		let res = await http.command(args._[0], args._[1])
		let end = process.hrtime(start)
		console.log(res)
		console.log('Request / response took ', end[0] * 1000000000 + end[1] + 'ns')
	} catch (err) { console.error(err) }
}

run().catch(err => console.error('Uncaught error', err))
