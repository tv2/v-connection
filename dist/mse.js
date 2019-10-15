"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("./peptalk");
const events_1 = require("events");
function flattenEntry(x) {
    let y = {};
    if (x.$) {
        for (let a in x.$) {
            y[a] = x.$[a];
        }
    }
    if (x.entry && Array.isArray(x.entry)) {
        for (let e of x.entry) {
            y[e.$.name] = flattenEntry(e);
            delete y[e.$.name].name;
        }
    }
    return y;
}
class MSERep extends events_1.EventEmitter {
    constructor(hostname, restPort, wsPort) {
        super();
        this.hostname = hostname;
        this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580;
        this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595;
        this.pep = peptalk_1.startPepTalk(this.hostname, this.wsPort);
        this.pep.connect();
    }
    getRundowns() { return []; }
    async getEngines() {
        let handlers = await this.pep.getJS('/scheduler');
        console.dir(handlers.js.scheduler.handler
            .filter((x) => x.$.type === 'viz')
            .map(flattenEntry), { depth: 10 });
        return Promise.resolve([]);
    }
    listProfiles() { return Promise.resolve([]); }
    getProfile(_profileName) { return Promise.resolve({}); }
    listShows() { return Promise.resolve([]); }
    getShow(_showName) { return Promise.resolve({}); }
    listPlaylists() { return Promise.resolve([]); }
    getPlaylist(_playlistName) { return Promise.resolve({}); }
    createRundown(_showID, _profile, _playlistID) {
        return Promise.resolve({});
    }
    deleteRundown(_showID, _profile) { return false; }
    createProfile(_profileName, _profileDetailsTbc) {
        return Promise.resolve({});
    }
    deleteProfile(_profileName) { return Promise.resolve(false); }
    async ping() {
        try {
            let res = await this.pep.ping();
            return { path: 'ping', status: 200, response: res.body };
        }
        catch (err) {
            err.path = 'ping';
            err.status = 418;
            err.response = err.message;
            throw err;
        }
    }
    async close() {
        await this.pep.close();
        return true;
    }
}
function createMSE(hostname, restPort, wsPort) {
    return new MSERep(hostname, restPort, wsPort);
}
exports.createMSE = createMSE;
async function run() {
    let mse = createMSE('mse_ws.ngrok.io', 80, 80);
    console.log(await mse.getEngines());
    mse.close();
}
run().catch(console.error);
//# sourceMappingURL=mse.js.map