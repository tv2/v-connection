import { createMSE } from '../mse'
import * as yargs from 'yargs'

let args = yargs
	.string('host')
	.number('port')
	.string('profile')
	.string('showID')
	.demandCommand(1, 1)
	.default('host', 'localhost')
	.default('port', 8595)
	.default('profile', 'SOFIE')
	.default('showID', '66E45216-9476-4BDC-9556-C3DB487ED9DF')
	.argv

async function run () {
	let mse = createMSE(args.host, undefined, args.port)
	let rundown = await mse.createRundown(args.showID, args.profile)
	let template = await rundown.getTemplate(args._[0] as string)
	console.dir(template, { depth: 20 })
	await mse.deleteRundown(rundown)
	await mse.close()
}

run().catch(console.error)
