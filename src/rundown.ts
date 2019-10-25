import { VRundown, VTemplate, InternalElement, ExternalElement, VElement } from './v-connection'
import { CommandResult } from './msehttp'
import { InexistentError } from './peptalk'
import { MSERep } from './mse'
import * as uuid from 'uuid'
import { flattenEntry, AtomEntry, FlatEntry } from './xml'

export class Rundown implements VRundown {
	readonly show: string
	readonly playlist: string
	readonly profile: string

	private readonly mse: MSERep
	private get pep () { return this.mse.getPep() }

	constructor (mseRep: MSERep, show: string, profile: string, playlist?: string) {
		this.mse = mseRep
		this.show = show
		this.profile = profile
		this.playlist = playlist ? playlist : uuid.v4()
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

	createElement (templateName: string, elementName: string, textFields: string[], channel?: string): Promise<InternalElement>
	createElement (vcpid: number, channel?: string, alias?: string): Promise<ExternalElement>
	createElement (_namdOrID: string | number, _elemantNameOrChannel?: string, _aliasOrTextFields?: string[] | string, _channel?: string): Promise<VElement> {
		// TODO ensure that a playlist is created with sub-element "elements"
		throw new Error('Method not implemented.')
	}

	async listElements (): Promise<Array<string | number>> {
		await this.mse.checkConnection()
		let [ showElementsList, playlistElementsList ] = await Promise.all([
			this.pep.getJS(`/storage/shows/{${this.show}}/elements`, 1),
			this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2) ])
		let flatShowElements = await flattenEntry(showElementsList.js as AtomEntry)
		let elementNames: Array<string | number> = Object.keys(flatShowElements).filter(x => x !== 'name')
		let flatPlaylistElements: FlatEntry = await flattenEntry(playlistElementsList.js as AtomEntry)
		let elementsRefs = Object.keys(flatPlaylistElements.elements as FlatEntry).map(k => {
			let ref = ((flatPlaylistElements.elements as FlatEntry)[k] as FlatEntry).value as string
			let lastSlash = ref.lastIndexOf('/')
			return +ref.slice(lastSlash + 1)
		})
		return elementNames.concat(elementsRefs)
	}

	deactivate (): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	deleteElement (_elementName: string | number): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	cue (_elementName: string | number): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	take (_elementName: string | number): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	continue (_elementName: string | number): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	continueReverse (_elementName: string | number): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	out (_elementName: string | number): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	activate (): Promise<CommandResult> {
		throw new Error('Method not implemented.')
	}

	purge (): Promise<CommandResult> {
		throw new Error('Method not implemented.')
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
