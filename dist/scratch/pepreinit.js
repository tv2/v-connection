"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("../peptalk");
const yargs = require("yargs");
let args = yargs
    .string('host')
    .number('port')
    .default('host', 'localhost')
    .default('port', 8595)
    .argv;
console.dir(args);
async function run() {
    let pt = peptalk_1.startPepTalk(args.host, args.port);
    let connected = await pt.connect();
    console.log(connected);
    console.log(pt.setTimeout(10000));
    try {
        console.log(await pt.reintialize());
    }
    catch (err) {
        console.dir(err);
    }
    await pt.close();
}
run().catch(err => {
    console.error('General error', err);
});
//# sourceMappingURL=pepreinit.js.map