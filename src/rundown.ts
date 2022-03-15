import {
	VRundown,
	VTemplate,
	InternalElement,
	ExternalElement,
	VElement,
	ExternalElementId,
	ElementId,
	isExternalElement,
	InternalElementId,
	isInternalElement,
	InternalElementIdWithCreator,
} from './v-connection'
import { CommandResult, createHTTPContext, HttpMSEClient, HTTPRequestError } from './msehttp'
import { InexistentError, LocationType, PepResponse } from './peptalk'
import { CREATOR_NAME, MSERep } from './mse'
import { flattenEntry, AtomEntry, FlatEntry } from './xml'
import * as uuid from 'uuid'
import { has, wrapInBracesIfNeeded } from './util'

interface ExternalElementInfo {
	vcpid: number
	channel?: string
	refName: string
}

const ALTERNATIVE_CONCEPT = 'alternative_concept'

export class Rundown implements VRundown {
	readonly playlist: string
	readonly profile: string
	readonly description: string

	private readonly mse: MSERep
	private get pep() {
		return this.mse.getPep()
	}
	private msehttp: HttpMSEClient
	private channelMap: Record<string, ExternalElementInfo> = {}
	private initialChannelMapPromise: Promise<any>

	constructor(mseRep: MSERep, profile: string, playlist: string, description: string) {
		this.mse = mseRep
		this.profile = profile.startsWith('/config/profiles/') ? profile.slice(17) : profile
		this.playlist = playlist
		if (this.playlist.startsWith('{')) {
			this.playlist = this.playlist.slice(1)
		}
		if (this.playlist.endsWith('}')) {
			this.playlist = this.playlist.slice(0, -1)
		}
		this.description = description
		this.msehttp = createHTTPContext(
			this.profile,
			this.mse.resthost ? this.mse.resthost : this.mse.hostname,
			this.mse.restPort
		)
		this.initialChannelMapPromise = this.buildChannelMap().catch((err) =>
			console.error(`Warning: Failed to build channel map: ${err.message}`)
		)
	}

	private static makeKey(elementId: ElementId) {
		return isExternalElement(elementId)
			? `${elementId.vcpid}_${elementId.channel ?? ''}`
			: `${elementId.showId}_${elementId.instanceName}`
	}

	private async buildChannelMap(elementId?: ExternalElementId): Promise<boolean> {
		if (elementId && has(this.channelMap, Rundown.makeKey(elementId))) {
			return true
		}
		await this.mse.checkConnection()
		const elements = elementId ? [elementId] : await this.listExternalElements()
		for (const e of elements) {
			if (typeof e !== 'string') {
				const element = await this.getElement(e)
				this.channelMap[Rundown.makeKey(e)] = {
					vcpid: e.vcpid,
					channel: element.channel,
					refName: has(element, 'name') && typeof element.name === 'string' ? element.name : 'ref',
				}
			}
		}
		return elementId ? has(this.channelMap, Rundown.makeKey(elementId)) : false
	}

	private ref(elementId: ExternalElementId, unescape = false): string {
		const key = Rundown.makeKey(elementId)
		let str = this.channelMap[key]?.refName || 'ref'

		if (unescape) {
			// Return the unescaped string
			str = str.replace('%23', '#')
		} else {
			// Return the escaped string
			str = str.replace('#', '%23')
		}
		return str
	}

	async listTemplates(showId: string): Promise<string[]> {
		await this.mse.checkConnection()
		const templateList = await this.pep.getJS(`/storage/shows/{${showId}}/mastertemplates`, 1)
		const flatTemplates = await flattenEntry(templateList.js as AtomEntry)
		return Object.keys(flatTemplates).filter((x) => x !== 'name')
	}

	async getTemplate(templateName: string, showId: string): Promise<VTemplate> {
		await this.mse.checkConnection()
		const template = await this.pep.getJS(`/storage/shows/{${showId}}/mastertemplates/${templateName}`)
		let flatTemplate = await flattenEntry(template.js as AtomEntry)
		if (Object.keys(flatTemplate).length === 1) {
			flatTemplate = flatTemplate[Object.keys(flatTemplate)[0]] as FlatEntry
		}
		return flatTemplate as VTemplate
	}

	async createElement(
		elementId: InternalElementId,
		templateName: string,
		textFields: string[],
		channel?: string
	): Promise<InternalElement>
	async createElement(elementId: ExternalElementId): Promise<ExternalElement>
	async createElement(
		elementId: ElementId,
		templateName?: string,
		textFields?: string[],
		channel?: string
	): Promise<VElement> {
		// TODO ensure that a playlist is created with sub-element "elements"
		if (isInternalElement(elementId)) {
			this.assertInternalElementDoesNotExist(elementId)
			return this.createInternalElement(elementId, templateName as string, textFields as string[], channel)
		} else {
			this.checkChannelMapWasBuilt()
			this.assertExternalElementDoesNotExist(elementId)
			return this.createExternalElement(elementId)
		}
	}

	private async assertInternalElementDoesNotExist(elementId: InternalElementId) {
		try {
			await this.getElement(elementId)
			throw new Error(`An internal graphics element with name '${elementId.instanceName}' already exists.`)
		} catch (err) {
			if (err.message.startsWith('An internal graphics element')) throw err
		}
	}

	private async createInternalElement(
		elementId: InternalElementId,
		templateName: string,
		textFields: string[],
		channel?: string
	): Promise<InternalElement> {
		const template = await this.getTemplate(templateName, elementId.showId)
		// console.dir((template[nameOrID] as any).model_xml.model.schema[0].fielddef, { depth: 10 })
		let fielddef
		if (this.hasModel(template)) {
			fielddef = (template as any).model_xml.model.schema[0].fielddef
		} else {
			throw new Error(
				`Could not retrieve field definitions for tempalte '${templateName}'. Not creating element '${elementId.instanceName}'.`
			)
		}
		let fieldNames: string[] = fielddef ? fielddef.map((x: any): string => x.$.name) : []
		let entries = ''
		const data: { [name: string]: string } = {}
		if (textFields.length > fieldNames.length) {
			throw new Error(
				`For template '${templateName}' with ${fieldNames.length} field(s), ${textFields.length} fields have been provided.`
			)
		}
		fieldNames = fieldNames.sort()
		for (let x = 0; x < fieldNames.length; x++) {
			entries += `    <entry name="${fieldNames[x]}">${textFields[x] ? textFields[x] : ''}</entry>\n`
			data[fieldNames[x]] = textFields[x] ? textFields[x] : ''
		}
		const vizProgram = channel ? ` viz_program="${channel}"` : ''
		await this.pep.insert(
			`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`,
			`<element name="${
				elementId.instanceName
			}" guid="${uuid.v4()}" updated="${new Date().toISOString()}" creator="${CREATOR_NAME}" ${vizProgram}>
<ref name="master_template">/storage/shows/{${elementId.showId}}/mastertemplates/${templateName}</ref>
<entry name="default_alternatives"/>
<entry name="data">
${entries}
</entry>
</element>`,
			LocationType.Last
		)
		return {
			name: elementId.instanceName,
			template: templateName,
			data,
			channel,
		}
	}

	private hasModel(template: VTemplate) {
		return (
			has(template, 'model_xml') &&
			typeof template.model_xml === 'object' &&
			has(template.model_xml, 'model') &&
			typeof template.model_xml.model === 'object'
		)
	}

	private async assertExternalElementDoesNotExist(elementId: ExternalElementId) {
		try {
			await this.getElement(elementId)
			throw new Error(`An external graphics element with name '${elementId.vcpid}' already exists.`)
		} catch (err) {
			if (err.message.startsWith('An external graphics element')) throw err
		}
	}

	private async checkChannelMapWasBuilt() {
		try {
			await this.initialChannelMapPromise
		} catch (err) {
			console.error(`Warning: createElement: Channel map not built: ${err.message}`)
		}
	}

	private async createExternalElement(elementId: ExternalElementId): Promise<ExternalElement> {
		const vizProgram = elementId.channel ? ` viz_program="${elementId.channel}"` : ''
		const { body: path } = await this.pep.insert(
			`/storage/playlists/{${this.playlist}}/elements/`,
			`<ref available="0.00" loaded="0.00" take_count="0"${vizProgram}>/external/pilotdb/elements/${elementId.vcpid}</ref>`,
			LocationType.Last
		)
		this.channelMap[Rundown.makeKey(elementId)] = {
			vcpid: elementId.vcpid,
			channel: elementId.channel,
			refName: path ? path.slice(path.lastIndexOf('/') + 1) : 'ref',
		}
		return {
			vcpid: elementId.vcpid.toString(),
			channel: elementId.channel,
		}
	}

	async listInternalElements(showId: string): Promise<InternalElementIdWithCreator[]> {
		await this.mse.checkConnection()
		const showElementsList = await this.pep.getJS(`/storage/shows/{${showId}}/elements`, 1)
		const flatShowElements = await flattenEntry(showElementsList.js as AtomEntry)
		const elementNames: Array<InternalElementIdWithCreator> = Object.keys(flatShowElements)
			.filter((x) => x !== 'name')
			.map((element) => ({
				instanceName: element,
				showId,
				creator: (flatShowElements[element] as FlatEntry).creator as string | undefined,
			}))
		return elementNames
	}

	async listExternalElements(): Promise<Array<ExternalElementId>> {
		await this.mse.checkConnection()
		const playlistElementsList = await this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2)
		const flatPlaylistElements: FlatEntry = await flattenEntry(playlistElementsList.js as AtomEntry)
		const elementsRefs = flatPlaylistElements.elements
			? Object.keys(flatPlaylistElements.elements as FlatEntry).map((k) => {
					const entry = (flatPlaylistElements.elements as FlatEntry)[k] as FlatEntry
					const ref = entry.value as string
					const lastSlash = ref.lastIndexOf('/')
					return { vcpid: +ref.slice(lastSlash + 1), channel: entry.viz_program as string | undefined }
			  })
			: []
		return elementsRefs
	}

	async initializeShow(showId: string): Promise<CommandResult> {
		return this.msehttp.initializeShow(showId)
	}
	async cleanupShow(showId: string): Promise<CommandResult> {
		return this.msehttp.cleanupShow(showId)
	}

	async activate(twice?: boolean, initPlaylist = true): Promise<CommandResult> {
		let result: CommandResult = {
			// Returned when initShow = false and initPlaylist = false
			path: '/',
			status: 200,
			response: 'No commands to run.',
		}
		if (twice && initPlaylist) {
			result = await this.msehttp.initializePlaylist(this.playlist)
		}
		if (initPlaylist) {
			result = await this.msehttp.initializePlaylist(this.playlist)
		}
		return result
	}

	async deactivate(): Promise<CommandResult> {
		return this.msehttp.cleanupPlaylist(this.playlist)
	}

	async deleteElement(elementId: ElementId): Promise<PepResponse> {
		if (isInternalElement(elementId)) {
			return this.pep.delete(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
		} else {
			// Note: For some reason, in contrast to the other commands, the delete command only works with the path being unescaped:
			const path = this.getExternalElementPath(elementId, true)
			if (await this.buildChannelMap(elementId)) {
				return this.pep.delete(path)
			} else {
				throw new InexistentError(-1, path)
			}
		}
	}

	async cue(elementId: ElementId): Promise<CommandResult> {
		if (isInternalElement(elementId)) {
			return this.msehttp.cue(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
		} else {
			const path = this.getExternalElementPath(elementId)
			if (await this.buildChannelMap(elementId)) {
				return this.msehttp.cue(path)
			} else {
				throw new HTTPRequestError(
					`Cannot cue external element as ID '${elementId.vcpid}' is not known in this rundown.`,
					this.msehttp.baseURL,
					path
				)
			}
		}
	}

	async take(elementId: ElementId): Promise<CommandResult> {
		if (isInternalElement(elementId)) {
			return this.msehttp.take(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
		} else {
			const path = this.getExternalElementPath(elementId)
			if (await this.buildChannelMap(elementId)) {
				return this.msehttp.take(path)
			} else {
				throw new HTTPRequestError(
					`Cannot take external element as ID '${elementId.vcpid}' is not known in this rundown.`,
					this.msehttp.baseURL,
					path
				)
			}
		}
	}

	async continue(elementId: ElementId): Promise<CommandResult> {
		if (isInternalElement(elementId)) {
			return this.msehttp.continue(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
		} else {
			const path = this.getExternalElementPath(elementId)
			if (await this.buildChannelMap(elementId)) {
				return this.msehttp.continue(path)
			} else {
				throw new HTTPRequestError(
					`Cannot continue external element as ID '${elementId.vcpid}' is not known in this rundown.`,
					this.msehttp.baseURL,
					path
				)
			}
		}
	}

	async continueReverse(elementId: ElementId): Promise<CommandResult> {
		if (isInternalElement(elementId)) {
			return this.msehttp.continueReverse(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
		} else {
			const path = this.getExternalElementPath(elementId)
			if (await this.buildChannelMap(elementId)) {
				return this.msehttp.continueReverse(path)
			} else {
				throw new HTTPRequestError(
					`Cannot continue reverse external element as ID '${elementId.vcpid}' is not known in this rundown.`,
					this.msehttp.baseURL,
					path
				)
			}
		}
	}

	async out(elementId: ElementId): Promise<CommandResult> {
		if (isInternalElement(elementId)) {
			return this.msehttp.out(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
		} else {
			const path = this.getExternalElementPath(elementId)
			if (await this.buildChannelMap(elementId)) {
				return this.msehttp.out(path)
			} else {
				throw new HTTPRequestError(
					`Cannot take out external element as ID '${elementId.vcpid}' is not known in this rundown.`,
					this.msehttp.baseURL,
					path
				)
			}
		}
	}

	async initialize(elementId: ExternalElementId): Promise<CommandResult> {
		const path = this.getExternalElementPath(elementId)
		if (await this.buildChannelMap(elementId)) {
			return this.msehttp.initialize(path)
		} else {
			throw new HTTPRequestError(
				`Cannot initialize external element as ID '${elementId.vcpid}' is not known in this rundown.`,
				this.msehttp.baseURL,
				path
			)
		}
	}

	async purgeInternalElements(
		showIds: string[],
		onlyCreatedByUs?: boolean,
		elementsToKeep?: InternalElementId[]
	): Promise<PepResponse> {
		const elementsToKeepSet = new Set(
			elementsToKeep?.map((e) => {
				return Rundown.makeKey(e)
			})
		)
		for (const showId of showIds) {
			if (!onlyCreatedByUs && !elementsToKeep?.length) {
				await this.pep.replace(`/storage/shows/{${showId}}/elements`, '<elements/>')
				continue
			}
			const elements = await this.listInternalElements(showId)
			await Promise.all(
				elements.map(async (element) => {
					if (
						(!onlyCreatedByUs || element.creator === CREATOR_NAME) &&
						!elementsToKeepSet.has(Rundown.makeKey(element))
					) {
						return this.deleteElement(element)
					}
					return Promise.resolve()
				})
			)
		}
		return { id: '*', status: 'ok' } as PepResponse
	}

	async purgeExternalElements(elementsToKeep?: ExternalElementId[]): Promise<PepResponse> {
		// let playlist = await this.mse.getPlaylist(this.playlist)
		// if (playlist.active_profile.value) {
		// 	throw new Error(`Cannot purge an active profile.`)
		// }
		if (elementsToKeep && elementsToKeep.length) {
			await this.buildChannelMap()
			const elementsSet = new Set(
				elementsToKeep.map((e) => {
					return Rundown.makeKey(e)
				})
			)
			for (const key in this.channelMap) {
				if (elementsSet.has(key)) continue
				try {
					await this.deleteElement(this.channelMap[key])
				} catch (e) {
					if (!(e instanceof InexistentError)) {
						throw e
					}
				}
			}
		} else {
			await this.pep.replace(`/storage/playlists/{${this.playlist}}/elements`, '<elements/>')
		}
		return { id: '*', status: 'ok' } as PepResponse
	}

	async getElement(elementId: ElementId): Promise<VElement> {
		await this.mse.checkConnection()
		if (isExternalElement(elementId)) {
			const playlistsList = await this.pep.getJS(`/storage/playlists/{${this.playlist}}/elements`, 2)
			const flatPlaylistElements: FlatEntry = await flattenEntry(playlistsList.js as AtomEntry)
			const elementKey = Object.keys(flatPlaylistElements.elements as FlatEntry).find((k) => {
				const elem = (flatPlaylistElements.elements as FlatEntry)[k] as FlatEntry
				const ref = elem.value as string
				return ref.endsWith(`/${elementId.vcpid}`) && (!elementId.channel || elem.viz_program === elementId.channel)
			})
			const element =
				typeof elementKey === 'string'
					? ((flatPlaylistElements.elements as FlatEntry)[elementKey] as FlatEntry)
					: undefined
			if (!element) {
				throw new InexistentError(
					typeof playlistsList.id === 'number' ? playlistsList.id : 0,
					`/storage/playlists/{${this.playlist}}/elements#${elementId.vcpid}`
				)
			} else {
				element.vcpid = elementId.vcpid.toString()
				element.channel = element.viz_program
				element.name = elementKey && elementKey !== '0' ? elementKey.replace('#', '%23') : 'ref'
				return element as ExternalElement
			}
		} else {
			const element = await this.pep.getJS(`/storage/shows/{${elementId.showId}}/elements/${elementId.instanceName}`)
			const flatElement: FlatEntry = (await flattenEntry(element.js as AtomEntry))[elementId.instanceName] as FlatEntry
			flatElement.name = elementId.instanceName
			return flatElement as InternalElement
		}
	}

	async isActive(): Promise<boolean> {
		const playlist = await this.mse.getPlaylist(this.playlist)
		return playlist.active_profile && typeof playlist.active_profile.value !== 'undefined'
	}

	private getExternalElementPath(elementId: ExternalElementId, unescape = false): string {
		return `/storage/playlists/{${this.playlist}}/elements/${this.ref(elementId, unescape)}`
	}

	async setAlternativeConcept(value: string): Promise<void> {
		const environmentPath = `/storage/playlists/${wrapInBracesIfNeeded(this.playlist)}/environment`
		const alternativeConceptEntry = `<entry name="${ALTERNATIVE_CONCEPT}">${value}</entry>`

		// Environment entry must exists!
		await this.pep.ensurePath(environmentPath)
		await this.pep.replace(`${environmentPath}/${ALTERNATIVE_CONCEPT}`, alternativeConceptEntry)
	}
}
