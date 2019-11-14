"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mse_1 = require("../mse");
const yargs = require("yargs");
let args = yargs
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
    .default('httpport', 8580)
    .argv;
async function wait(t) {
    return new Promise((resolve, _reject) => {
        setTimeout(resolve, t);
    });
}
async function run() {
    let mse = mse_1.createMSE(args.host, args.httpport, args.port, args.httphost.length > 0 ? args.httphost : undefined);
    let rundown = await mse.createRundown(args.showID, args.profile);
    let d = new Date();
    let elementName = `CLI_TEST_${d.toISOString()}`;
    let element = await rundown.createElement(args.template, elementName, args._ ? args._ : []);
    console.dir(element, { depth: 20 });
    await rundown.cue(elementName);
    await rundown.take(elementName);
    await wait(args.timing);
    console.log(`Taking element ${elementName} out.`);
    await rundown.out(elementName);
    if (args['delete']) {
        await rundown.deleteElement(elementName);
        await mse.deleteRundown(rundown);
    }
    await mse.close();
}
run().catch(console.error);
//# sourceMappingURL=internal.js.map