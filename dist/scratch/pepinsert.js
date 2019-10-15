"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("../peptalk");
const yargs = require("yargs");
let args = yargs
    .string('host')
    .number('port')
    .string('location')
    .string('sibling')
    .boolean('js')
    .string('_')
    .number('depth')
    .default('host', 'localhost')
    .default('port', 8595)
    .default('location', 'first')
    .demandCommand(2, 2)
    .coerce('location', (l) => {
    switch (l.slice(0, 1).toLowerCase()) {
        case 'f': return peptalk_1.LocationType.First;
        case 'l': return peptalk_1.LocationType.Last;
        case 'b': return peptalk_1.LocationType.Before;
        case 'a': return peptalk_1.LocationType.After;
        default: return peptalk_1.LocationType.First;
    }
})
    .argv;
console.dir(args);
async function run() {
    let pt = peptalk_1.startPepTalk(args.host, args.port);
    let connected = await pt.connect(true);
    console.log(connected);
    try {
        console.log(await pt.insert(args._[0], args._[1], args.location ? args.location : peptalk_1.LocationType.First, args.sibling));
    }
    catch (err) {
        console.error('!!!', err);
    }
    await pt.close();
}
run().catch(err => {
    console.error('General error', err);
});
//# sourceMappingURL=pepinsert.js.map