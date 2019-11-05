import { VRundown, VTemplate, InternalElement, ExternalElement, VElement } from './v-connection'
import { CommandResult, createHTTPContext, HttpMSEClient } from './msehttp'
import { InexistentError, LocationType, PepResponse } from './peptalk'
import { MSERep } from './mse'
import { flattenEntry, AtomEntry, FlatEntry } from './xml'
import * as uuid from 'uuid'

export class Rundown implements VRundown {
	readonly show: string
	readonly playlist: string
	readonly profile: string
	readonly description: string

	private readonly mse: MSERep
	private get pep () { return this.mse.getPep() }
	private msehttp: HttpMSEClient
	private channelMap: { [vcpid: number]: string | null } = {}

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
			let fieldNames: string[] = (template[nameOrID] as any).model_xml.model.schema[0].fielddef.map((x: any): string => x.$.name)
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
			this.channelMap[nameOrID] = elementNameOrChannel ? elementNameOrChannel : null
			await this.pep.insert(`/storage/playlists/{${this.playlist}}/elements/`,
`<ref available="0.00" loaded="0.00" take_count="0"${vizProgram}>/external/pilotdb/elements/${nameOrID}</ref>`,
				LocationType.Last)
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

	async activate (): Promise<CommandResult> {
		let playlist = await this.mse.getPlaylist(this.playlist)
		if (playlist.active_profile.value) {
			console.log(`Warning: Re-activating a already active playlist '${this.playlist}'.`)
		}
		return this.msehttp.initializePlaylist(this.playlist)
	}

	deactivate (): Promise<CommandResult> {
		return this.msehttp.cleanupPlaylist(this.playlist)
	}

	async deleteElement (elementName: string | number): Promise<PepResponse> {
		if (typeof elementName === 'string') {
			return this.pep.delete(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			throw new Error('Method not implemented.')
		}
	}

	cue (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.cue(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			return this.msehttp.cue(`/external/pilotdb/elements/${elementName}`)
		}
	}

	async take (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.take(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (typeof this.channelMap[elementName] === 'string') {
				let startTime = process.hrtime()
				await this.pep.set(`/external/pilotdb/elements/${elementName}`, 'viz_program', this.channelMap[elementName] as string)
				console.log('End time', process.hrtime(startTime))
			} else if (typeof this.channelMap[elementName] === 'undefined') {
				// TODO to be truly stateless, we should pull this value from the playlist
			}
			return this.msehttp.take(`/external/pilotdb/elements/${elementName}`)
		}
	}

	continue (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.continue(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			return this.msehttp.continue(`/external/pilotdb/elements/${elementName}`)
		}
	}

	continueReverse (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.continueReverse(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			return this.msehttp.continueReverse(`/external/pilotdb/elements/${elementName}`)
		}
	}

	async out (elementName: string | number): Promise<CommandResult> {
		if (typeof elementName === 'string') {
			return this.msehttp.out(`/storage/shows/{${this.show}}/elements/${elementName}`)
		} else {
			if (typeof this.channelMap[elementName] === 'string') {
				await this.pep.set(`/external/pilotdb/elements/${elementName}`, 'viz_program', this.channelMap[elementName] as string)
			} else if (typeof this.channelMap[elementName] === 'undefined') {
				// TODO to be truly stateless, we should pull this value from the playlist
			}
			return this.msehttp.out(`/external/pilotdb/elements/${elementName}`)
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
				(element as ExternalElement).vcpid = elementName.toString()
				return element as ExternalElement
			}
		} else {
			let element = await this.pep.getJS(`/storage/shows/{${this.show}}/elements/${elementName}`)
			let flatElement: FlatEntry = (await flattenEntry(element.js as AtomEntry))[elementName] as FlatEntry
			flatElement.name = elementName
			return flatElement as InternalElement
		}
	}
}
