"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("./peptalk");
const events_1 = require("events");
const xml_1 = require("./xml");
const rundown_1 = require("./rundown");
const uuidRe = /[a-fA-f0-9]{8}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{12}/;
class MSERep extends events_1.EventEmitter {
    constructor(hostname, restPort, wsPort, resthost) {
        super();
        this.connection = undefined;
        this.timeoutMS = 3000;
        this.hostname = hostname;
        this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580;
        this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595;
        this.resthost = resthost; // For ngrok testing only
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
    getPep() {
        return this.pep;
    }
    getRundowns() { return []; }
    async getEngines() {
        await this.checkConnection();
        let handlers = await this.pep.getJS('/scheduler');
        let vizEntries = handlers.js.scheduler.handler
            .filter((x) => x.$.type === 'viz');
        let viz = await Promise.all(vizEntries.map(x => xml_1.flattenEntry(x)));
        return viz;
    }
    async listProfiles() {
        await this.checkConnection();
        let profileList = await this.pep.getJS('/config/profiles', 1);
        let flatList = await xml_1.flattenEntry(profileList.js);
        return Object.keys(flatList).filter((x) => x !== 'name');
    }
    async getProfile(profileName) {
        await this.checkConnection();
        let profile = await this.pep.getJS(`/config/profiles/${profileName}`);
        let flatProfile = await xml_1.flattenEntry(profile.js);
        return flatProfile;
    }
    async listShows() {
        await this.checkConnection();
        let showList = await this.pep.getJS('/storage/shows', 1);
        let flatList = await xml_1.flattenEntry(showList.js);
        return Object.keys(flatList).filter((x) => x !== 'name');
    }
    async getShow(showName) {
        if (!showName.startsWith('{')) {
            showName = '{' + showName;
        }
        if (!showName.endsWith('}')) {
            showName = showName + '}';
        }
        if (!showName.match(uuidRe)) {
            return Promise.reject(new Error(`Show name must be a UUID and '${showName}' is not.`));
        }
        await this.checkConnection();
        let show = await this.pep.getJS(`/storage/shows/${showName}`);
        let flatShow = await xml_1.flattenEntry(show.js);
        return flatShow;
    }
    async listPlaylists() {
        await this.checkConnection();
        let playlistList = await this.pep.getJS('/storage/playlists', 1);
        let atomEntry = playlistList.js;
        // Horrible hack ... playlists not following atom pub model
        if (atomEntry.entry) {
            atomEntry.entry.entry = atomEntry.entry.playlist;
            delete atomEntry.entry.playlist;
        }
        let flatList = await xml_1.flattenEntry(playlistList.js);
        return Object.keys(flatList).filter((x) => x !== 'name');
    }
    async getPlaylist(playlistName) {
        if (!playlistName.startsWith('{')) {
            playlistName = '{' + playlistName;
        }
        if (!playlistName.endsWith('}')) {
            playlistName = playlistName + '}';
        }
        if (!playlistName.match(uuidRe)) {
            return Promise.reject(new Error(`Playlist name must be a UUID and '${playlistName}' is not.`));
        }
        await this.checkConnection();
        let playlist = await this.pep.getJS(`/storage/playlists/${playlistName}`);
        let flatPlayliat = await xml_1.flattenEntry(playlist.js);
        return flatPlayliat;
    }
    // Rundown basics task
    async createRundown(showID, profileName, playlistID) {
        // TODO Do async stuff to check parameters
        return new rundown_1.Rundown(this, showID, profileName, playlistID);
    }
    // Rundown basics task
    deleteRundown(_showID, _profileName) { return false; }
    // Advanced feature
    createProfile(_profileName, _profileDetailsTbc) {
        return Promise.reject(new Error('Not implemented. Creating profiles is a future feature.'));
    }
    // Advanced feature
    deleteProfile(_profileName) {
        return Promise.reject(new Error('Not implemented. Deleting profiles ia a future feature.'));
    }
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
    timeout(t) {
        if (typeof t !== 'number')
            return this.timeoutMS;
        return this.pep.setTimeout(t);
    }
}
exports.MSERep = MSERep;
/**
 *  Factory to create an [[MSE]] instance to manage commumication between a Node
 *  application and a Viz Media Sequencer Engine.
 *  @param hostname Hostname or IP address for the instance of the MSE to control.
 *  @param restPort Optional port number for HTTP traffic, is different from the
 *                  default of 8580.
 *  @param wsPort   Optional port number for PepTalk traffic over websockets, if
 *                  different from the default of 8695.
 *  @param resthost Optional different host name for rest connection - for testing
 *                  purposes only.
 *  @return New MSE that will start to initialize a connection based on the parameters.
 */
function createMSE(hostname, restPort, wsPort, resthost) {
    return new MSERep(hostname, restPort, wsPort, resthost);
}
exports.createMSE = createMSE;
// async function run () {
// 	let mse = createMSE('mse_ws.ngrok.io', 80, 80, 'mse_http.ngrok.io')
// 	let rundown = await mse.createRundown('66E45216-9476-4BDC-9556-C3DB487ED9DF', 'MOSART', '5A58448C-3CBE-4146-B3DF-EFC918D16266')
// 	// console.dir(await rundown.createElement('Bund', 'SUPERFLY3', ['Number One']), { depth: 10 })
// 	console.dir(await rundown.deleteElement('SUPERFLY3'), { depth: 10 })
// 	await mse.close()
// 	// console.log('After close.')
// }
//
// run().catch(console.error)
//# sourceMappingURL=mse.js.map