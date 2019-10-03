import { EventEmitter } from 'events';

interface VTemplate { }
interface VElement { }
interface InternalElement extends VElement { }
interface ExternalElement extends VElement { }
interface CommandResult { }

interface VRundown {
	show: string
	playlist: string
	profile: string
	listTemplates: () => Promise<string[]>
	readTemplate (templateName: string): Promise<VTemplate>
	createElement (templateName: string, elementName: string, textFields: string[]): Promise<InternalElement>
	createElement (templateName: string, vcpid: number): Promise<ExternalElement>
	listElements (): Promise<string[]>
	readElement (elementName: string): Promise<VElement>
 	deleteElement (elementName: string): Promise<CommandResult>
	cue (elementName: string): Promise<CommandResult>
	take (elementName: string): Promise<CommandResult>
	continue (elementName: string): Promise<CommandResult>
	out (elementName: string): Promise<CommandResult>
	activate (): Promise<CommandResult>
	deactivate (): Promise<CommandResult>
	purge (): Promise<CommandResult>
}

interface VizEngine {
	hostname: string
	handler: string
}

interface VProfile {
	name: string
}

interface VShow {
	id: string
}

interface PepRequest { }
interface PepResponse { }

enum LocationType {
	First = 'first',
	Last = 'last',
	Before = 'before',
	After = 'after'
}

enum Capability {
	peptalk,
	noevents,
	uri,
	xmlscheduling,
	xmlscheduling_feedback,
	pretty,
	prettycolors
}

interface PepError extends Error {
	id: number
	type: string
}

interface InexistentError extends PepError {
	type: 'inexistent'
	path: string
}

interface InvalidError extends PepError {
	type: 'invaid'
	description: string
}

interface NotAllowedError extends PepError {
	type: 'not_allowed'
	reason: string
}

interface SyntaxError extends PepError {
	type: 'syntax'
	description: string
}

interface UnspecifiedError extends PepError {
	type: 'unspecified'
	description: string
}

interface PepTalk extends EventEmitter { // How to do this?
	readonly timeout: number
	readonly counter: number
	connect (noevents?: boolean): Promise<PepResponse>
	close (): Promise<PepResponse>
	ping (): Promise<PepResponse>
	send (message: string): Promise<PepResponse>
	copy (sourcePath: string, newPath: string, location: LocationType, sibling?: string): Promise<PepResponse>
	delete (path: string): Promise<PepResponse>
	ensurePath (path: string): Promise<PepResponse>
	get (path: string, depth?: number): Promise<PepResponse>
	insert (path: string, xml: string, location: LocationType, sibling?: string): Promise<PepResponse>
	move (oldPath: string, newPath: string, location: LocationType, sibling?: string): Promise<PepResponse>
	protocol (capability: Capability | Capability[]): Promise<PepResponse>
	reintialize (): Promise<PepResponse>
	replace (path: string, xml: string): Promise<PepResponse>
	set (path: string, textOrKey: string, attributeValue?: string): Promise<PepResponse> // Text
	uri (path: string, type: string, base?: string): Promise<PepResponse>
	pendingRequests: { [id: number]: PepRequest }
	setTimeout (t: number): number
}

interface MSE extends PepTalk {
	readonly hostname: string
	readonly restPort: number
	readonly wsPort: number
	getRundowns (): VRundown[]
	getEngines (): Promise<VizEngine[]>
	getProfiles (): Promise<VProfile[]>
	getShows (): Promise<VShow[]>
	getPlaylists (): Promise<VShow[]>
	createRundown (showID: string, profile: string, playlistID?: string): Promise<VRundown>
	deleteRundown (showID: string, profile: string): boolean
	createProfile (profileName: string, profileDetailsTbc: any): Promise<VProfile>
	deleteProfile (profileName: string): Promise<VProfile>
	ping (): Promise<CommandResult>
	// Not creating shows - leave that to trio
	// Add methods here for MSE configuration
}
