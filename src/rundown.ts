import { VRundown, VTemplate, InternalElement, ExternalElement, VElement } from './v-connection'
import { CommandResult, createHTTPContext, HttpMSEClient, HTTPRequestError } from './msehttp'
import { InexistentError, LocationType, PepResponse } from './peptalk'
import { MSERep } from './mse'
import { flattenEntry, AtomEntry, FlatEntry } from './xml'
import * as uuid from 'uuid'

interface ExternalElementInfo {
	channelName: string | null
	refName: string
}

export class Rundown implements VRundown {
	readonly show: string
	readonly playlist: string
	readonly profile: string
	readonly description: string

	private readonly mse: MSERep
	private get pep () { return this.mse.getPep() }
	private msehttp: HttpMSEClient
	private channelMap: { [vcpid: number]: ExternalElementInfo } = {}

	constructor (mseRep: MSERep, show: string, profile: string, playlist: string, description: string) {
		this.mse = mseRep
		this.show = show.startsWith('/storage/shows/') ? show.slice(15) : show
		if (this.show.startsWith('{')) { this.show = this.show.slice(1) }
		if (this.show.endsWith('}')) { this.show = this.show.slice(0, -1) }
		this.profile = profile.startsWith('/config/profiles/') ? profile.slice(17) : profile
		this.playlist = playlist
		if (this.playlist.startsWith('{')) { this.playlist = this.playlist.slice(1) }
		if (this.playlist.endsWith('}')) { this.playlist = this.playlist.slice(0, -1) }
		this.description = description
		this.msehttp = createHTTPContext(this.profile, this.mse.resthost ? this.mse.resthost : this.mse.hostname, this.mse.restPort)
		this.buildChannelMap().catch(err => console.error(`Warning: Failed to build channel map: ${err.message}`))
	}

	private async buildChannelMap (vcpid?: number): Promise<boolean> {
		if (typeof vcpid === 'number') {
			if (this.channelMap.hasOwnProperty(vcpid)) { return true }
		}
		let elements = vcpid ? [ vcpid ] : await this.listElements()
		for (let e of elements) {
			if (typeof e === 'number') {
				let element = await this.getElement(e)
				if (element.channel) {
					this.channelMap[e] = {
						channelName: element.channel,
						refName: element.hasOwnProperty('name') && typeof element.name === 'string' ? element.name : 'ref'
					}
				} else {
					this.channelMap[e] = {
						channelName: null,
						refName:  element.hasOwnProperty('name') && typeof element.name === 'string' ? element.name : 'ref'
					}
				}
			}
		}
		return typeof vcpid === 'number' ? this.channelMap.hasOwnProperty(vcpid) : false
	}

	private ref (id: number): string {
		return this.channelMap[id].refName ? this.channelMap[id].refName.replace('#', '%23') : 'ref'
	}

	async listTemplates (): Promise<string[]> {
		await this.mse.checkConnection()
		let templateList = await this.pep.getJS(`/storage/shows/{${this.show}}/mastertemplates`, 1)
		let flatTemplates = await flattenEntry(templateList.js as AtomEntry)
		return Object.keys(flatTemplates).filter(x => x !== 'name')
	}

	async getTemplate (templateName: string): Promise<VTemplate> {
		await this.mse.checkConnection()
		let template = await this.pep.getJS(`/storage/shows/{${this.show}}/mastertemplates/${templateName}`)
		let flatTemplate = await flattenEntry(template.js as AtomEntry)
		if (Object.keys(flatTemplate).length === 1) {
			flatTemplate = flatTemplate[Object.keys(flatTemplate)[0]] as FlatEntry
		}
		return flatTemplate as VTemplate
	}

	async createElement (templateName: string, elementName: string, textFields: string[], channel?: string): Promise<InternalElement>
	async createElement (vcpid: number, channel?: string, alias?: string): Promise<ExternalElement>
	async createElement (nameOrID: string | number, elementNameOrChannel?: string, aliasOrTextFields?: string[] | string, channel?: string): Promise<VElement> {
		// TODO ensure that a playlist is created with sub-element "elements"
		if (typeof nameOrID === 'string') {
			try {
				if (elementNameOrChannel) { await this.getElement(elementNameOrChannel) }
				throw new Error(`An internal graphics element with name '${elementNameOrChannel}' already exists.`)
			} catch (err) {
				if (err.message.startsWith('An internal graphics element')) throw err
			}
			let template = await this.getTemplate(nameOrID)
			// console.dir((template[nameOrID] as any).model_xml.model.schema[0].fielddef, { depth: 10 })
			let fielddef = (template as any).model_xml.model.schema[0].fielddef
			let fieldNames: string[] = fielddef ? fielddef.map((x: any): string => x.$.name) : []
			let entries = ''
			let data: { [ name: string ]: string} = {}
			if (Array.isArray(aliasOrTextFields)) {
				if (aliasOrTextFields.length > fieldNames.length) {
					throw new Error(`For template '${nameOrID}' with ${fieldNames.length} field(s), ${aliasOrTextFields.length} fields have been provided.`)
				}
				fieldNames = fieldNames.sort()
				for (let x = 0 ; x < fieldNames.length ; x++) {
					entries += `    <entry name="${fieldNames[x]}">${aliasOrTextFields[x] ? aliasOrTextFields[x] : ''}</entry>\n`
					data[fieldNames[x]] = aliasOrTextFields[x] ? aliasOrTextFields[x] : ''
				}
			}
			await this.pep.insert(`/storage/shows/{${this.show}}/elements/${elementNameOrChannel}`,
`<element name="${elementNameOrChannel}" guid="${uuid.v4()}" updated="${(new Date()).toISOString()}" creator="Sofie">
  <ref name="master_template">/storage/shows/{${this.show}}/mastertemplates/${nameOrID}</ref>
  <entry name="default_alternatives"/>
  <entry name="data">
${entries}
  </entry>
</element>`,
				LocationType.Last)
			return {
				name: elementNameOrChannel,
				template: nameOrID,
				data,
				channel
			} as InternalElement
		} else {
			let vizProgram = elementNameOrChannel ? ` viz_program="${elementNameOrChannel}"` : ''
			let { body: path } = await this.pep.insert(`/storage/playlists/{${this.playlist}}/elements/`,
`<ref available="0.00" loaded="0.00" take_count="0"${vizProgram}>/external/pilotdb/elements/${nameOrID}</ref>`,
				LocationType.Last)
			this.channelMap[nameOrID] = {
				channelName: elementNameOrChannel ? elementNameOrChannel : null,
				refName: path ? path.slice(path.lastIndexOf('/') + 1) : 'ref'
			}
			return {
				vcpid: nameOrID.toString(),
				channel: elementNameOrChannel
			} as ExternalElement
		}
	}

	async listElements (): Promise<Array<string | number>> {
		await this.mse.checkConnection()
		let [ showElementsList, playlistElementsList ] = await Promise.all([
			this.pep.getJS(`/storage/shows/{${this.show}}/elements`, 1),
			this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2) ])
		let flatShowElements = await flattenEntry(showElementsList.js as AtomEntry)
		let elementNames: Array<string | number> = Object.keys(flatShowElements).filter(x => x !== 'name')
		let flatPlaylistElements: FlatEntry = await flattenEntry(playlistElementsList.js as AtomEntry)
		let elementsRefs = flatPlaylistElements.elements ?
			Object.keys(flatPlaylistElements.elements as FlatEntry).map(k => {
				let ref = ((flatPlaylistElements.elements as FlatEntry)[k] as FlatEntry).value as string
				let lastSlash = ref.lastIndexOf('/')
				return +ref.slice(lastSlash + 1)
			}) : []
		return elementNames.concat(elementsRefs)
	}

	async activate (load?: boolean): Promise<CommandResult> {
		// let playlist = await this.mse.getPlaylist(this.playlist)
		// if (!playlist.active_profile.value) {
		if (load) {
			await this.msehttp.initializePlaylist(this.playlist)
		}
		return this.msehttp.initializePlaylist(this.playlist)
	}

	deactivate (): Promise<CommandResult> {
		return this.msehttp.cleanupPlaylist(this.playlist)
	}

	cleanup (): Promise<CommandResult> {
		return this.msehttp.cleanupShow(this.show)
	}

	async deleteElement (elementName: string | number): Promise<PepResponse> {
		if (typeof elementName === 'string') {
			return this.pep.delete(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (await this.buildChannelMap(elementName)) {
				return this.pep.delete(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			} else {
				throw new InexistentError(-1, `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			}
		}
	}

	async cue (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.cue(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (await this.buildChannelMap(elementName)) {
				return this.msehttp.cue(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			} else {
				throw new HTTPRequestError(
					`Cannot cue external element as ID '${elementName}' is not known in this rundown.`,
					this.msehttp.baseURL,
					`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			}
		}
	}

	async take (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.take(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (await this.buildChannelMap(elementName)) {
				return this.msehttp.take(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			} else {
				throw new HTTPRequestError(
					`Cannot take external element as ID '${elementName}' is not known in this rundown.`,
					this.msehttp.baseURL,
					`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			}
		}
	}

	async continue (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.continue(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (await this.buildChannelMap(elementName)) {
				return this.msehttp.continue(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			} else {
				throw new HTTPRequestError(
					`Cannot continue external element as ID '${elementName}' is not known in this rundown.`,
					this.msehttp.baseURL,
					`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			}
		}
	}

	async continueReverse (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.continueReverse(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (await this.buildChannelMap(elementName)) {
				return this.msehttp.continueReverse(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			} else {
				throw new HTTPRequestError(
					`Cannot continue reverse external element as ID '${elementName}' is not known in this rundown.`,
					this.msehttp.baseURL,
					`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			}

		}
	}

	async out (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.out(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (await this.buildChannelMap(elementName)) {
				return this.msehttp.out(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			} else {
				throw new HTTPRequestError(
					`Cannot take out external element as ID '${elementName}' is not known in this rundown.`,
					this.msehttp.baseURL,
					`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
			}
		}
	}

	async initialize (elementName: number): Promise<CommandResult> {
		if (await this.buildChannelMap(elementName)) {
			return this.msehttp.initialize(`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
		} else {
			throw new HTTPRequestError(
				`Cannot initialize external element as ID '${elementName}' is not known in this rundown.`,
				this.msehttp.baseURL,
				`/storage/playlists/{${this.playlist}}/elements/${this.ref(elementName)}`)
		}
	}

	async purge (): Promise<PepResponse> {
		let playlist = await this.mse.getPlaylist(this.playlist)
		if (playlist.active_profile.value) {
			throw new Error(`Cannot purge an active profile.`)
		}
		await this.pep.replace(`/storage/shows/{${this.show}}/elements`, '<elements/>')
		await this.pep.replace(`/storage/playlists/{${this.playlist}}/elements`, '<elements/>')
		return { id: '*', status: 'ok' } as PepResponse
	}

	async getElement (elementName: string | number): Promise<VElement> {
		await this.mse.checkConnection()
		if (typeof elementName === 'number') {
			let playlistsList = await this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2)
			let flatPlaylistElements: FlatEntry = await flattenEntry(playlistsList.js as AtomEntry)
			let elementKey = Object.keys(flatPlaylistElements.elements as FlatEntry).find(k => {
				let ref = ((flatPlaylistElements.elements as FlatEntry)[k] as FlatEntry).value as string
				return ref.endsWith(`/${elementName}`)
			})
			let element = typeof elementKey === 'string' ? (flatPlaylistElements.elements as FlatEntry)[elementKey] as FlatEntry : undefined
			if (!element) {
				throw new InexistentError(
					typeof playlistsList.id === 'number' ? playlistsList.id : 0,
					`/storage/playlists/{${this.playlist}}/elements#${elementName}`)
			} else {
				element.vcpid = elementName.toString()
				element.channel = element.viz_program
				element.name = this.ref(elementName)
				return element as ExternalElement
			}
		} else {
			let element = await this.pep.getJS(`/storage/shows/{${this.show}}/elements/${elementName}`)
			let flatElement: FlatEntry = (await flattenEntry(element.js as AtomEntry))[elementName] as FlatEntry
			flatElement.name = elementName
			return flatElement as InternalElement
		}
	}

	async isActive (): Promise<boolean> {
		let playlist = await this.mse.getPlaylist(this.playlist)
		return typeof playlist.active_profile.value !== 'undefined'
	}
}
