/**
 *  Interfaces for controlling Vizrt Media Sequencer Engine from Node.js applications.
 */

import { EventEmitter } from 'events'

/**
 *  Representation of the schema for a single data field in a master template.
 */
export interface VModelField { // Needs some work to deal with images
	/**
	 *  Unique name of the element within its schema. This element is often - but
	 *  not always - a number or at least two digits, e.g. `06` rather than `6`.
	 *  VDF-based templates use string names.
	 */
	name: string
	/** Default value(s) for the element. */
	value: string | string[]
	/**
	 *  Label for the element, used for display in some GUIs. Note that more than
	 *  field may have the same label.
	 */
	label: string
	/** Field must be displayed on a single line? */
	singleline?: boolean
	/** Field must be displayed with uppercase characeters? */
	uppercase?: boolean
	/** MIME-type for the data element. Typically `application/vnd.vizrt.richtext+xml`. */
	mediatype: string
	/** Internal detail of hoe to communicate with the Viz Engine about this element. */
	container?: {
		uuid: string
		path: string
	}
}

/**
 *  Represenatation of a _master template_ within a [[VShow|show]].
 */
export interface VTemplate {
	/** Master template name. */
	name: string
	/** Representation of the `default_alternatives` structure. Not in use. */
	defaultAlternatives: any
	/** Reference to _scene selectors_ used by this _master template_. */
	layers: {
		ref: string | string[]
		// TODO more detailed references, such as ALL_OUT templates
	}
	/** Schema describing the expected data fields. */
	modelXML?: VModelField[]
}

/**
 *  An instance of a graphical element that can be displayed and/or used to
 *  influence the graphical behaviour of a running show.
 */
export interface VElement {
	/**
	 *  Calculate path to the element. Used by _commands_.
	 *  @returns Path in the VDOM tree to this element.
	 */
	path (): string
}

/** Graphical element that is fully described within the VDOM tree. */
export interface InternalElement extends VElement {
	/** Name of the specific element. Should be built before the element is taken. */
	name: string
	/** Name of the [[VTemplate|master template]] used by this element. */
	template: string
	/** Name/value pairs containing the data for each field of the template. */
	data: { [ name: string ]: string }
}

/** Graphical element that is defined externally, e.g. in the pilot database. */
export interface ExternalElement extends VElement {
	/** Unique identifier for the template in the external system. */
	vcpid: number
}

/** Result of executing an HTTP command. Command promise is resolved. */
export interface CommandResult {
	/** HTTP status code. Normally `200 OK`. */
	status: number
	/** Response received. */
	response: string
}

/** Client error - a `400` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface HTTPClientError extends Error, CommandResult { }

/** Server error - a `500` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface HTTPServerError extends Error, CommandResult { }

/**
 *  Representation of all the graphics associated with a Sofie rundown. A rundown object is
 *  created to link a [[VShow|show]] full of templates with a profile that is the target of
 *  commands sent to that show.
 *
 *  External elements can be named using an optional alias and either their identifier or the
 *  alias can be used to send that command.
 */
export interface VRundown {
	/** Identifier for the show containing the [[VTemplate|master templates]] associated with this rundown. */
	readonly show: string
	/** Identifier for the playlist built specifically for this rundown. */
	readonly playlist: string
	/** Identifier for the profile that is the targer for commands, the link to the Viz Engines being. */
	readonly profile: string
	/**
	 *  List all the master templates associated with this rundown.
	 *  @returns Resolves to a list of all template names for this rundown.
	 */
	listTemplates (): Promise<string[]>
	/**
	 *  Read details of a specific [[VTemplate|template]].
	 *  @param templateName Name of the emplate to retrieve the elements from,
	 *                      e.g. `bund`.
	 *  @returns Resolves to the details of the named template.
	 */
	readTemplate (templateName: string): Promise<VTemplate>
	/**
	 *  Create a new [[InternalElement|_internal_ graphical element]] that is an
	 *  instance of the named [[VTemplate|template]].
	 *  @param templateName Name of the template the element is an instance of.
	 *  @param elementName  Name of the graphical element to create.
	 *  @param textFields   List of values for each of the graphical elements. **How are these sorted?**
	 *  @returns Resolves to a newly created element.
	 */
	createElement (templateName: string, elementName: string, textFields: string[]): Promise<InternalElement>
	/**
	 *  Create a new [[ExternalElement|_external_ graphical element]] by unique reference number.
	 *  @param vcpid Unique reference number for the element in the external source,
	 *               e.g. a pilot database.
	 *  @param alias Optional name to use to reference the element. Note that this
	 *               name is stored only within the library and not persisted in
	 *               the MSE.
	 *  @returns Resolves to a newly created element reference.
	 */
	createElement (vcpid: number, alias?: string): Promise<ExternalElement>
	/**
	 *  List all the graphical elements created for this rundown.
	 *  @returns Resolves to a list of graphical element names for this rundown.
	 */
	listElements (): Promise<string[]>
	/**
	 *  Read the details of a graphical element in this rundown.
	 *  @param elementName Name or reference for the element to retrieve the details
	 *                     for.
	 *  @returns Resolves to provide the details of the named element.
	 */
	readElement (elementName: string | number): Promise<VElement>
	/**
	 *  Delete a graphical element from the rundown.
	 *  @param elementName Name of reference for the element to delete.
	 *  @returns Resolves to indicate the delete was successful, otherwise rejects.
	 */
 	deleteElement (elementName: string | number): Promise<CommandResult>
	/**
	 *  Send a _cue_ command for a named graphical element, preparing it for smooth display.
	 *  @param elementName Name or reference for the gephical element to cue.
	 *  @returns Resolves on acceptance of the cue command.
	 */
	cue (elementName: string | number): Promise<CommandResult>
	/**
	 *  Send a _take_ command for a named graphical element, requesting that it is displayed.
	 *  @param elementName Name or reference for the gephical element to take in.
	 *  @returns Resolves on acceptance of the take command.
	 */
	take (elementName: string | number): Promise<CommandResult>
	/**
	 *  Send a _continue_ command for a named graphical element, causing the next
	 *  presentation state is to be displayed.
	 *  @param elementName Name or reference for the gephical element to continue.
	 *  @returns Resolves on acceptance of the continue command.
	 */
	continue (elementName: string | number): Promise<CommandResult>
	/**
	 *  Send an _out_ command for the named graphical element, ending its ongoing
	 *  display.
	 *  @param elementName Name or reference for the graphical element to take-out.
	 *  @return Resolves on acceptance of the take-out command.
	 */
	out (elementName: string | number): Promise<CommandResult>
	/** Activate a rundown, causing all initialisations to be run prior to execution of a rundown. */
	activate (): Promise<CommandResult>
	/** Deactivate a rundown, cleaning up any transient elements associated with the rundownfrom the VDOM treee. Those required for post-rundown analysis will remain. */
	deactivate (): Promise<CommandResult>
	/** CLear up all graphical elements and state associated with a rundown, including those required for post-rundown analysis. */
	purge (): Promise<CommandResult>
}

/**
 *  Represenation of a connection and state of a Viz Engine.
 */
export interface VizEngine {
	hostname: string
	handler: string
	status: 'active' // add other states
	// TODO add the details of what is currently displayed according to the MSE
}

/**
 *  Representation of a MSE profile.
 */
interface VProfile {
	name: string
	// TODO add other profile details
}

/**
 *  Representation of a MSE show.
 */
interface VShow {
	id: string
	// TOOD add other show details
}

/**
 *  Location of a new XML element relative to an existing element.
 */
export enum LocationType {
	/** Insert a new element as the first child of a given parent. */
	First = 'first',
	/** Insert a new element as the last child of a given parent. */
	Last = 'last',
	/** Insert a new element before the given element. */
	Before = 'before',
	/** Insert a new element after the given element. */
	After = 'after'
}

export enum Capability {
	peptalk = 'peptalk',
	noevents = 'noevents',
	uri = 'uri',
	xmlscheduling = 'xmlscheduling',
	xmlscheduling_feedback = 'xmlscheduling_feedback',
	pretty = 'pretty',
	prettycolors = 'prettycolors'
}

interface PepMessage {
	id: number
	status: 'unknown' | 'ok' | 'inexistent' | 'invaid' | 'not_allowed' | 'syntax' | 'unspecified'
	sent: string
}

interface PepResponse extends PepMessage {
	response: string
}

export interface PepError extends Error, PepMessage {
	status: 'inexistent' | 'invaid' | 'not_allowed' | 'syntax' | 'unspecified'
}

export interface InexistentError extends PepError {
	status: 'inexistent'
	path: string
}

export interface InvalidError extends PepError {
	status: 'invaid'
	description: string
}

export interface NotAllowedError extends PepError {
	status: 'not_allowed'
	reason: string
}

export interface SyntaxError extends PepError {
	status: 'syntax'
	description: string
}

export interface UnspecifiedError extends PepError {
	status: 'unspecified'
	description: string
}

export interface PepTalk extends EventEmitter { // How to do this?
	readonly timeout: number
	readonly counter: number
	connect (noevents?: boolean): Promise<PepResponse>
	close (): Promise<PepResponse>
	// ping (): Promise<PepResponse>
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
	pendingRequests: { [id: number]: PepMessage }
	setTimeout (t: number): number
}

export interface MSE extends PepTalk {
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
