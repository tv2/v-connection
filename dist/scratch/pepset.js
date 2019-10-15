"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("../peptalk");
const yargs = require("yargs");
let args = yargs
    .string('host')
    .number('port')
    .string('_')
    .default('host', 'localhost')
    .default('port', 8595)
    .demandCommand(2, 3)
    .argv;
console.dir(args);
async function run() {
    let pt = peptalk_1.startPepTalk(args.host, args.port);
    let connected = await pt.connect(true);
    console.log(connected);
    try {
        console.log(await pt.set(args._[0], args._[1], args._[2]));
    }
    catch (err) {
        console.error('!!!', err);
    }
    await pt.close();
}
run().catch(err => {
    console.error('General error', err);
});
//# sourceMappingURL=pepset.js.map