"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("./peptalk");
const events_1 = require("events");
const xml_1 = require("./xml");
class MSERep extends events_1.EventEmitter {
    constructor(hostname, restPort, wsPort) {
        super();
        this.connection = undefined;
        this.hostname = hostname;
        this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580;
        this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595;
        this.pep = peptalk_1.startPepTalk(this.hostname, this.wsPort);
        this.connection = this.pep.connect();
    }
    async checkConnection() {
        try {
            if (this.connection) {
                await this.connection;
            }
            else {
                this.connection = this.pep.connect();
                throw new Error('Attempt to connect to PepTalk server failed. Retrying.');
            }
        }
        catch (err) {
            this.connection = this.pep.connect();
            throw err;
        }
    }
    getRundowns() { return []; }
    async getEngines() {
        await this.checkConnection();
        let handlers = await this.pep.getJS('/scheduler');
        let viz = handlers.js.scheduler.handler
            .filter((x) => x.$.type === 'viz')
            .map((x) => xml_1.flattenEntry(x));
        return viz;
    }
    async listProfiles() {
        await this.checkConnection();
        let profileList = await this.pep.getJS('/config/profiles', 1);
        let flatList = xml_1.flattenEntry(profileList.js);
        return Object.keys(flatList).filter((x) => x !== 'name');
    }
    async getProfile(profileName) {
        await this.checkConnection();
        let profile = await this.pep.getJS(`/config/profiles/${profileName}`);
        console.dir(profile.js, { depth: 10 });
        let flatProfile = xml_1.flattenEntry(profile.js);
        return flatProfile;
    }
    listShows() { return Promise.resolve([]); }
    getShow(_showName) { return Promise.resolve({}); }
    listPlaylists() { return Promise.resolve([]); }
    getPlaylist(_playlistName) { return Promise.resolve({}); }
    // Rundown basics task
    createRundown(_showID, _profile, _playlistID) {
        return Promise.resolve({});
    }
    // Rundown basics task
    deleteRundown(_showID, _profile) { return false; }
    // Advanced feature
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
        if (this.connection) {
            await this.pep.close();
            return true;
        }
        return false;
    }
}
function createMSE(hostname, restPort, wsPort) {
    return new MSERep(hostname, restPort, wsPort);
}
exports.createMSE = createMSE;
// async function run () {
// 	let mse = createMSE('mse_ws.ngrok.io', 80, 80)
// 	console.dir(await mse.getProfile('MOSART'), { depth: 10 })
// 	mse.close()
// }
//
// run().catch(console.error)
//# sourceMappingURL=mse.js.map