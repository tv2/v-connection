import { VRundown, VTemplate, InternalElement, ExternalElement, VElement } from './v-connection'
import { CommandResult } from './msehttp'
import { MSERep } from './mse'
import * as uuid from 'uuid'
import { flattenEntry, AtomEntry } from './xml'

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

	readTemplate (_templateName: string): Promise<VTemplate> {
		throw new Error('Method not implemented.')
	}

	createElement (templateName: string, elementName: string, textFields: string[], channel?: string): Promise<InternalElement>
	createElement (vcpid: number, channel?: string, alias?: string): Promise<ExternalElement>
	createElement (_namdOrID: string | number, _elemantNameOrChannel?: string, _aliasOrTextFields?: string[] | string, _channel?: string): Promise<VElement> {
		throw new Error('Method not implemented.')
	}

	listElements (): Promise<string[]> {
		throw new Error('Method not implemented.')
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

	getElement (_elementName: string | number): Promise<VElement> {
		throw new Error('Method not implemented.')
	}

}
