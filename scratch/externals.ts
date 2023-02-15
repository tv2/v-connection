import { createMSE } from '../src/mse'
import * as yargs from 'yargs'

const args = yargs
	.string('host')
	.number('port')
	.string('profile')
	.string('showID')
	.boolean('delete')
	.number('timing')
	.string('httphost')
	.number('httpport')
	.string('channel')
	.default('host', 'localhost')
	.default('port', 8595)
	.default('profile', 'SOFIE')
	.default('showID', '66E45216-9476-4BDC-9556-C3DB487ED9DF')
	.default('delete', true)
	.default('timing', 10000)
	.default('httphost', '')
	.default('httpport', 8580)
	.default('channel', 'FULL1').argv

async function wait(t: number) {
	return new Promise((resolve, _reject) => {
		setTimeout(resolve, t)
	})
}

async function run() {
	if (args._.some((x) => isNaN(+x))) {
		throw new Error('A VCPID integer identifier for each Pilot element is required.')
	}
	const mse = createMSE(args.host, args.httpport, args.port, args.httphost.length > 0 ? args.httphost : undefined)
	const rundown = await mse.createRundown(args.profile)
	const elementRefs = args._.map((x) => +x)
	await Promise.all(
		elementRefs.slice(0, 2).map(async (er) => rundown.createElement({ vcpid: er, channel: args.channel }))
	)
	// await wait(1000)
	await rundown.activate()

	await wait(100)

	// while (true) {
	for (let i = 0; i < elementRefs.length; i++) {
		console.log('Starting to process element', elementRefs[i])
		const elementId = { vcpid: elementRefs[i], channel: args.channel }
		if (i >= 2) {
			console.log(await rundown.createElement(elementId))
		}
		console.log(await rundown.initialize(elementId))
		// await rundown.activate()
		for (let x = 0; x < 5; x++) {
			console.log(x)
			await wait(1000)
		}
		console.log('take', elementRefs[i])
		console.log(await rundown.getElement(elementId))
		await rundown.take(elementId)
		for (let x = 0; x < 5; x++) {
			console.log(x)
			await wait(1000)
		}
		console.log('out', elementRefs[i])
		await rundown.out(elementId)
	}
	// }
	if (args['delete']) {
		// await rundown.deleteElement(elementRef)
		await rundown.deactivate()
		// await mse.deleteRundown(rundown)
	}
	await mse.close()
}

run().catch(console.error)
