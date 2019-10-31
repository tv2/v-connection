"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const msehttp_1 = require("./msehttp");
const peptalk_1 = require("./peptalk");
const uuid = require("uuid");
const xml_1 = require("./xml");
class Rundown {
    constructor(mseRep, show, profile, playlist) {
        this.mse = mseRep;
        this.show = show;
        this.profile = profile;
        this.playlist = playlist ? playlist : uuid.v4();
        this.msehttp = msehttp_1.createHTTPContext(this.profile, this.mse.resthost ? this.mse.resthost : this.mse.hostname, this.mse.restPort);
    }
    get pep() { return this.mse.getPep(); }
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
            let fieldNames = template[nameOrID].model_xml.model.schema[0].fielddef.map((x) => x.$.name);
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
        else {
            // FIXME how to build an element from a VCPID
            await this.pep.insert(`/storage/playlists/{${this.playlist}}/elements/`, `<ref>/external/pilotdb/elements/${nameOrID}</ref>`, peptalk_1.LocationType.Last);
            throw new Error('Method not implemented.');
        }
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
        let elementsRefs = Object.keys(flatPlaylistElements.elements).map(k => {
            let ref = flatPlaylistElements.elements[k].value;
            let lastSlash = ref.lastIndexOf('/');
            return +ref.slice(lastSlash + 1);
        });
        return elementNames.concat(elementsRefs);
    }
    deactivate() {
        throw new Error('Method not implemented.');
    }
    async deleteElement(elementName) {
        if (typeof elementName === 'string') {
            return this.pep.delete(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            throw new Error('Method not implemented.');
        }
    }
    cue(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.cue(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            return this.msehttp.cue(`/external/pilotdb/elements/${elementName}`);
        }
    }
    take(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.take(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            return this.msehttp.take(`/external/pilotdb/elements/${elementName}`);
        }
    }
    continue(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.continue(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            return this.msehttp.continue(`/external/pilotdb/elements/${elementName}`);
        }
    }
    continueReverse(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.continueReverse(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            return this.msehttp.continueReverse(`/external/pilotdb/elements/${elementName}`);
        }
    }
    out(elementName) {
        if (typeof elementName === 'string') {
            return this.msehttp.out(`/storage/shows/{${this.show}}/elements/${elementName}`);
        }
        else {
            return this.msehttp.out(`/external/pilotdb/elements/${elementName}`);
        }
    }
    activate() {
        throw new Error('Method not implemented.');
    }
    purge() {
        throw new Error('Method not implemented.');
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
}
exports.Rundown = Rundown;
//# sourceMappingURL=rundown.js.map