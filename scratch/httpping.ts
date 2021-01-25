import { createHTTPContext } from '../src/msehttp'
import * as yargs from 'yargs'

const args = yargs
	.string('profile')
	.string('host')
	.number('port')
	.default('profile', 'MOSART')
	.default('host', 'localhost')
	.default('port', 8580).argv

async function run() {
	try {
		const http = createHTTPContext(args.profile, args.host, args.port)
		http.setHTTPTimeout(30000)
		const ping = await http.ping()
		console.log(ping)
	} catch (err) {
		console.error(err)
	}
}

run().catch((err) => console.error('Uncaught error', err))
