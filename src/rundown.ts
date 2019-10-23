import { VRundown, VTemplate, InternalElement, ExternalElement, VElement } from './v-connection'
import { CommandResult } from './msehttp'

export class Rundown implements VRundown {
	show: string
	playlist: string
	profile: string

	listTemplates (): Promise<string[]> {
		throw new Error('Method not implemented.')
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
