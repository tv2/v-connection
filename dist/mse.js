"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peptalk_1 = require("./peptalk");
const events_1 = require("events");
const xml_1 = require("./xml");
const rundown_1 = require("./rundown");
const uuid = require("uuid");
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
        let flatPlaylist = await xml_1.flattenEntry(playlist.js);
        if (Object.keys(flatPlaylist).length === 1) {
            flatPlaylist = flatPlaylist[Object.keys(flatPlaylist)[0]];
        }
        return flatPlaylist;
    }
    // Rundown basics task
    async createRundown(showID, profileName, playlistID, description) {
        // TODO Do async stuff to check parameters
        // Check that the showID exists
        let playlistExists = false;
        showID = showID.toUpperCase();
        let date = new Date();
        description = description ? description : `Sofie Rundown ${date.toISOString()}`;
        try {
            await this.checkConnection();
            await this.pep.get(`/storage/shows/{${showID}}`, 1);
        }
        catch (err) {
            throw new Error(`The requested show to create a rundown for with ID '${showID}' does not exist in this MSE.`);
        }
        try {
            await this.pep.get(`/config/profiles/${profileName}`, 1);
        }
        catch (err) {
            throw new Error(`The profile with name '${profileName}' for a new rundown does not exist.`);
        }
        if (playlistID) {
            try {
                let playlist = await this.getPlaylist(playlistID);
                if (!playlist.profile.endsWith(`/${profileName}`)) {
                    throw new Error(`Referenced playlist exists but references profile '${playlist.profile}' rather than the given '${profileName}'.`);
                }
                playlistExists = true;
            }
            catch (err) {
                if (err.message.startsWith('Referenced playlist exists but')) {
                    throw err;
                }
                playlistExists = false;
            }
        }
        if (!playlistExists) {
            playlistID = playlistID && playlistID.match(uuidRe) ? playlistID.toUpperCase() : uuid.v4().toUpperCase();
        }
        let modifiedDate = `${date.getUTCDate().toString().padStart(2, '0')}.${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        await this.pep.insert(`/storage/playlists/{${playlistID}}`, `<playlist description="${description}" modified="${modifiedDate}" profile="/config/profiles/${profileName}" name="{${playlistID}}">
    <elements/>
    <entry name="environment">
        <entry name="alternative_concept"/>
    </entry>
    <entry name="cursors">
        <entry name="globals">
            <entry name="last_taken"/>
            <entry name="last_read"/>
        </entry>
    </entry>
    <entry backing="transient" name="active_profile"/>
    <entry name="meta"/>
    <entry name="settings"/>
    <entry name="ncs_cursor"/>
		<entry name="sofie_show">/storage/shows/{${showID}}</entry>
</playlist>`, peptalk_1.LocationType.Last);
        return new rundown_1.Rundown(this, showID, profileName, playlistID, description);
    }
    // Rundown basics task
    async deleteRundown(rundown) {
        let playlist = await this.getPlaylist(rundown.playlist);
        console.dir(playlist, { depth: 10 });
        if (playlist.active_profile.value) {
            throw new Error(`Cannot delete an active profile.`);
        }
        let delres = await this.pep.delete(`/storage/playlists/{${rundown.playlist}}`);
        return delres.status === 'ok';
    }
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
// 	let rundown = await mse.createRundown('66E45216-9476-4BDC-9556-C3DB487ED9DF', 'MOSART')
// 	console.dir(rundown)
// 	console.log('Deleted?', await rundown.purge())
// 	await rundown.createElement('Bund', 'SUPERWASP', [ 'Fred', 'Ginger' ])
// 	// console.dir(await rundown.deleteElement('SUPERFLY3'), { depth: 10 })
// 	await mse.close()
// 	// console.log('After close.')
// }
//
// run().catch(console.error)
//# sourceMappingURL=mse.js.map