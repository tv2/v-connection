"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mse_1 = require("../mse");
const yargs = require("yargs");
let args = yargs
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
    .default('channel', 'FULL1')
    .argv;
async function wait(t) {
    return new Promise((resolve, _reject) => {
        setTimeout(resolve, t);
    });
}
async function run() {
    if (isNaN(+args._[0])) {
        throw new Error('A VCPID integer identifier for a Pilot element is required.');
    }
    let mse = mse_1.createMSE(args.host, args.httpport, args.port, args.httphost.length > 0 ? args.httphost : undefined);
    let rundown = await mse.createRundown(args.showID, args.profile);
    let elementRef = +args._[0];
    let element = await rundown.createElement(elementRef, args.channel);
    await rundown.activate();
    console.dir(element, { depth: 20 });
    await wait(100);
    // await rundown.cue(elementRef)
    await wait(args.timing);
    // console.log(`Taking element ${elementRef} out.`)
    // await rundown.out(elementRef)
    for (let x = 0; x < 5; x++) {
        console.log(x);
        await wait(1000);
    }
    console.log('take');
    await rundown.take(elementRef);
    for (let x = 0; x < 5; x++) {
        console.log(x);
        await wait(1000);
    }
    console.log('out');
    await rundown.out(elementRef);
    if (args['delete']) {
        // await rundown.deleteElement(elementRef)
        await rundown.deactivate();
        await mse.deleteRundown(rundown);
    }
    await mse.close();
}
run().catch(console.error);
//# sourceMappingURL=external.js.map