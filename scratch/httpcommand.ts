import { createHTTPContext } from '../src/msehttp'
import * as yargs from 'yargs'

const args = yargs
	.string('profile')
	.string('host')
	.number('port')
	.demandCommand(2, 2)
	.default('profile', 'MOSART')
	.default('host', 'localhost')
	.default('port', 8580).argv

async function run() {
	try {
		const http = createHTTPContext(args.profile, args.host, args.port)
		http.setHTTPTimeout(10000)
		const start = process.hrtime()
		const res = await http.command(args._[0] as string, args._[1] as string)
		const end = process.hrtime(start)
		console.log(res)
		console.log('Request / response took ', end[0] * 1000000000 + end[1] + 'ns')
	} catch (err) {
		console.error(err)
	}
}

run().catch((err) => console.error('Uncaught error', err))
