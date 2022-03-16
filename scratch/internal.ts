import { createMSE } from '../src/mse'
import * as yargs from 'yargs'

const args = yargs
	.string('host')
	.number('port')
	.string('profile')
	.string('showID')
	.string('template')
	.boolean('delete')
	.number('timing')
	.string('httphost')
	.number('httpport')
	.default('host', 'localhost')
	.default('port', 8595)
	.default('profile', 'SOFIE')
	.default('showID', '66E45216-9476-4BDC-9556-C3DB487ED9DF')
	.default('template', 'bund')
	.default('delete', true)
	.default('timing', 10000)
	.default('httphost', '')
	.default('httpport', 8580).argv

async function wait(t: number) {
	return new Promise((resolve, _reject) => {
		setTimeout(resolve, t)
	})
}

async function run() {
	const mse = createMSE(args.host, args.httpport, args.port, args.httphost.length > 0 ? args.httphost : undefined)
	const rundown = await mse.createRundown(args.showID, args.profile)
	const d = new Date()
	const showId = args.showID
	const instanceName = `CLI_TEST_${d.toISOString()}`
	const elementId = { instanceName, showId }
	const element = await rundown.createElement(elementId, args.template, args._ ? (args._ as string[]) : [])
	console.dir(element, { depth: 20 })
	// await rundown.cue(elementName)
	await rundown.take(elementId)
	await wait(args.timing)
	console.log(`Taking element ${instanceName} out.`)
	await rundown.out(elementId)
	if (args['delete']) {
		await rundown.deleteElement(elementId)
		await mse.deleteRundown(rundown)
	}
	await mse.close()
}

run().catch(console.error)
