"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const msehttp_1 = require("./msehttp");
const peptalk_1 = require("./peptalk");
const xml_1 = require("./xml");
const uuid = require("uuid");
class Rundown {
    constructor(mseRep, show, profile, playlist, description) {
        this.channelMap = {};
        this.mse = mseRep;
        this.show = show.startsWith('/storage/shows/') ? show.slice(15) : show;
        if (this.show.startsWith('{')) {
            this.show = this.show.slice(1);
        }
        if (this.show.endsWith('}')) {
            this.show = this.show.slice(0, -1);
        }
        this.profile = profile.startsWith('/config/profiles/') ? profile.slice(17) : profile;
        this.playlist = playlist;
        if (this.playlist.startsWith('{')) {
            this.playlist = this.playlist.slice(1);
        }
        if (this.playlist.endsWith('}')) {
            this.playlist = this.playlist.slice(0, -1);
        }
        this.description = description;
        this.msehttp = msehttp_1.createHTTPContext(this.profile, this.mse.resthost ? this.mse.resthost : this.mse.hostname, this.mse.restPort);
        this.buildChannelMap().catch(err => console.error(`Warning: Failed to build channel map: ${err.message}`));
    }
    get pep() { return this.mse.getPep(); }
    async buildChannelMap(vcpid) {
        if (typeof vcpid === 'number') {
            if (this.channelMap.hasOwnProperty(vcpid)) {
                return true;
            }
        }
        await this.mse.checkConnection();
        let elements = vcpid ? [vcpid] : await this.listElements();
        for (let e of elements) {
            if (typeof e === 'number') {
                let element = await this.getElement(e);
                if (element.channel) {
                    this.channelMap[e] = {
                        channelName: element.channel,
                        refName: element.hasOwnProperty('name') && typeof element.name === 'string' ? element.name : 'ref'
                    };
                }
                else {
                    this.channelMap[e] = {
                        channelName: null,
                        refName: element.hasOwnProperty('name') && typeof element.name === 'string' ? element.name : 'ref'
                    };
                }
            }
        }
        return typeof vcpid === 'number' ? this.channelMap.hasOwnProperty(vcpid) : false;
    }
    ref(id) {
        return this.channelMap[id].refName ? this.channelMap[id].refName.replace('#', '%23') : 'ref';
    }
    async listTemplates() {
        await this.mse.checkConnection();
        let templateList = await this.pep.getJS(`/storage/shows/{${this.show}}/mastertemplates`, 1);
        let flatTemplates = await xml_1.flattenEntry(templateList.js);
        return Object.keys(flatTemplates).filter(x => x !== 'name');
    }
    async getTemplate(templateName) {
        await this.mse.checkConnection();
        let template = await this.pep.getJS(`/storage/shows/{${this.show}}/mastertemplates/${templateName}`);
        let flatTemplate = await xml_1.flattenEntry(template.js);
        if (Object.keys(flatTemplate).length === 1) {
            flatTemplate = flatTemplate[Object.keys(flatTemplate)[0]];
        }
        return flatTemplate;
    }
    async createElement(nameOrID, elementNameOrChannel, aliasOrTextFields, channel) {
        // TODO ensure that a playlist is created with sub-element "elements"
        if (typeof nameOrID === 'string') {
            try {
                if (elementNameOrChannel) {
                    await this.getElement(elementNameOrChannel);
                }
                throw new Error(`An internal graphics element with name '${elementNameOrChannel}' already exists.`);
            }
            catch (err) {
                if (err.message.startsWith('An internal graphics element'))
                    throw err;
            }
            let template = await this.getTemplate(nameOrID);
            // console.dir((template[nameOrID] as any).model_xml.model.schema[0].fielddef, { depth: 10 })
            let fielddef = template.model_xml.model.schema[0].fielddef;
            let fieldNames = fielddef ? fielddef.map((x) => x.$.name) : [];
            let entries = '';
            let data = {};
            if (Array.isArray(aliasOrTextFields)) {
                if (aliasOrTextFields.length > fieldNames.length) {
                    throw new Error(`For template '${nameOrID}' with ${fieldNames.length} field(s), ${aliasOrTextFields.length} fields have been provided.`);
                }
                fieldNames = fieldNames.sort();
                for (let x = 0; x < fieldNames.length; x++) {
                    entries += `    <entry name="${fieldNames[x]}">${aliasOrTextFields[x] ? aliasOrTextFields[x] : ''}</entry>\n`;
                    data[fieldNames[x]] = aliasOrTextFields[x] ? aliasOrTextFields[x] : '';
                }
            }
            await this.pep.insert(`/storage/shows/{${this.show}}/elements/${elementNameOrChannel}`, `<element name="${elementNameOrChannel}" guid="${uuid.v4()}" updated="${(new Date()).toISOString()}" creator="Sofie">
  <ref name="master_template">/storage/shows/{${this.show}}/mastertemplates/${nameOrID}</ref>
  <entry name="default_alternatives"/>
  <entry name="data">
${entries}
  </entry>
</element>`, peptalk_1.LocationType.Last);
            return {
                name: elementNameOrChannel,
                template: nameOrID,
                data,
                channel
            };
        }
        // @ts-ignore
        if (typeof nameOrID === 'number') {
            let vizProgram = elementNameOrChannel ? ` viz_program="${elementNameOrChannel}"` : '';
            let { body: path } = await this.pep.insert(`/storage/playlists/{${this.playlist}}/elements/`, `<ref available="0.00" loaded="0.00" take_count="0"${vizProgram}>/external/pilotdb/elements/${nameOrID}</ref>`, peptalk_1.LocationType.Last);
            this.channelMap[nameOrID] = {
                channelName: elementNameOrChannel ? elementNameOrChannel : null,
                refName: path ? path.slice(path.lastIndexOf('/') + 1) : 'ref'
            };
            return {
                vcpid: nameOrID.toString(),
                channel: elementNameOrChannel
            };
        }
        throw new Error('Create element called with neither a string or numberical reference.');
    }
    async listElements() {
        await this.mse.checkConnection();
        let [showElementsList, playlistElementsList] = await Promise.all([
            this.pep.getJS(`/storage/shows/{${this.show}}/elements`, 1),
            this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2)
        ]);
        let flatShowElements = await xml_1.flattenEntry(showElementsList.js);
        let elementNames = Object.keys(flatShowElements).filter(x => x !== 'name');
        let flatPlaylistElements = await xml_1.flattenEntry(playlistElementsList.js);
        let elementsRefs = flatPlaylistElements.elements ?
            Object.keys(flatPlaylistElements.elements).map(k => {
                let ref = flatPlaylistElements.elements[k].value;
                let lastSlash = ref.lastIndexOf('/');
                return +ref.slice(lastSlash + 1);
            }) : [];
        return elementNames.concat(elementsRefs);
    }
    async activate(load) {
        // let playlist = await this.mse.getPlaylist(this.playlist)
        // if (!playlist.active_profile.value) {
        if (load) {
            await this.msehttp.initializePlaylist(this.playlist);
        }
        return this.msehttp.initializePlaylist(this.playlist);
    }
    deactivate() {
        return this.msehttp.cleanupPlaylist(this.playlist);
    }
    cleanup() {
        return this.msehttp.cleanupShow(this.show);
    }
    async deleteElement(elementName) {
        if (typeof elementName === 'string') {
            return this.pep.delete(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            if (await this.buildChannelMap(elementName)) {
                return this.pep.delete(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
            else {
                throw new peptalk_1.InexistentError(-1, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
        }
    }
    async cue(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.cue(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            if (await this.buildChannelMap(elementName)) {
                return this.msehttp.cue(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
            else {
                throw new msehttp_1.HTTPRequestError(`Cannot cue external element as ID '${elementName}' is not known in this rundown.`, this.msehttp.baseURL, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
        }
    }
    async take(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.take(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            if (await this.buildChannelMap(elementName)) {
                return this.msehttp.take(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
            else {
                throw new msehttp_1.HTTPRequestError(`Cannot take external element as ID '${elementName}' is not known in this rundown.`, this.msehttp.baseURL, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
        }
    }
    async continue(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.continue(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            if (await this.buildChannelMap(elementName)) {
                return this.msehttp.continue(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
            else {
                throw new msehttp_1.HTTPRequestError(`Cannot continue external element as ID '${elementName}' is not known in this rundown.`, this.msehttp.baseURL, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
        }
    }
    async continueReverse(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.continueReverse(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            if (await this.buildChannelMap(elementName)) {
                return this.msehttp.continueReverse(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
            else {
                throw new msehttp_1.HTTPRequestError(`Cannot continue reverse external element as ID '${elementName}' is not known in this rundown.`, this.msehttp.baseURL, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
        }
    }
    async out(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.out(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            if (await this.buildChannelMap(elementName)) {
                return this.msehttp.out(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
            else {
                throw new msehttp_1.HTTPRequestError(`Cannot take out external element as ID '${elementName}' is not known in this rundown.`, this.msehttp.baseURL, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
            }
        }
    }
    async initialize(elementName) {
        if (await this.buildChannelMap(elementName)) {
            return this.msehttp.initialize(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
        }
        else {
            throw new msehttp_1.HTTPRequestError(`Cannot initialize external element as ID '${elementName}' is not known in this rundown.`, this.msehttp.baseURL, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`);
        }
    }
    async purge() {
        // let playlist = await this.mse.getPlaylist(this.playlist)
        // if (playlist.active_profile.value) {
        // 	throw new Error(`Cannot purge an active profile.`)
        // }
        await this.pep.replace(`/storage/shows/{${this.show}}/elements`, '<elements/>');
        await this.pep.replace(`/storage/playlists/{${this.playlist}}/elements`, '<elements/>');
        return { id: '*', status: 'ok' };
    }
    async getElement(elementName) {
        await this.mse.checkConnection();
        if (typeof elementName === 'number') {
            let playlistsList = await this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2);
            let flatPlaylistElements = await xml_1.flattenEntry(playlistsList.js);
            let elementKey = Object.keys(flatPlaylistElements.elements).find(k => {
                let ref = flatPlaylistElements.elements[k].value;
                return ref.endsWith(`/${elementName}`);
            });
            let element = typeof elementKey === 'string' ? flatPlaylistElements.elements[elementKey] : undefined;
            if (!element) {
                throw new peptalk_1.InexistentError(typeof playlistsList.id === 'number' ? playlistsList.id : 0, `/storage/playlists/{${this.playlist}}/elements#${elementName}`);
            }
            else {
                element.vcpid = elementName.toString();
                element.channel = element.viz_program;
                element.name = this.ref(elementName);
                return element;
            }
        }
        else {
            let element = await this.pep.getJS(`/storage/shows/{${this.show}}/elements/${elementName}`);
            let flatElement = (await xml_1.flattenEntry(element.js))[elementName];
            flatElement.name = elementName;
            return flatElement;
        }
    }
    async isActive() {
        let playlist = await this.mse.getPlaylist(this.playlist);
        return typeof playlist.active_profile.value !== 'undefined';
    }
}
exports.Rundown = Rundown;
//# sourceMappingURL=rundown.js.map