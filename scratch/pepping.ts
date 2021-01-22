import { startPepTalk } from '../src/peptalk'
import * as yargs from 'yargs'

const args = yargs.string('host').number('port').default('host', 'localhost').default('port', 8595).argv

async function run() {
	console.log(
		'Note: This tool attempts to ping before connect, while connected and then after the connection has gone.'
	)
	const pt = startPepTalk(args.host, args.port)
	try {
		await pt.get('/', 0)
	} catch (err) {
		console.error(err)
	}
	const connected = await pt.connect()
	console.log(connected)
	try {
		const start = process.hrtime()
		const pingResult = await pt.ping()
		const end = process.hrtime(start)
		console.log(end, pingResult)
	} catch (err) {
		console.error('!!!', err)
	}
	await pt.close()
	await pt.get('/', 0).catch(console.error)
}

run().catch((err) => {
	console.error('General error', err)
})
