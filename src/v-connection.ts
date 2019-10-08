/**
 *  Interfaces for controlling Vizrt Media Sequencer Engine from Node.js applications.
 *
 *  Intended usage pattern:
 *  1. Create an [[MSE]] instance to manage all connections to the MSE server.
 *  2. Discover the details of availale [[VShow|shows]], [[VizEngine|Viz Engines]]
 *     and [[VProfile|profiles]. TODO create a profile?
 *  3. Use the MSE to create [[VRundown|rundowns]] that link shows to profiles.
 *  4. Add all the [[VElement|graphical elements]] used in a show.
 *  5. Activate a rundown and send commands to take graphics in and out.
 *  6. Deactivate a rundown and finally purge all associated elements and state.
 */

import { EventEmitter } from 'events'
import { URL } from 'url'

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
	/**
	 *  Activate a rundown, causing all initialisations to be run prior to the
	 *  execution of a rundown.
	 *  @returns Resolves on successful rundown activation.
	 */
	activate (): Promise<CommandResult>
	/**
	 *  Deactivate a rundown, cleaning up any transient elements associated with
	 *  the rundown from the VDOM tree. Those XML elements required for post-rundown
	 *  analysis will remain.
	 *  @result Resolves on successful rundown deactivation.
	 */
	deactivate (): Promise<CommandResult>
	/**
	 *  Clear up all graphical elements and state associated with a rundown,
	 *  including those required for post-rundown analysis.
	 *  @result Resolves on successful rundown purge.
	 */
	purge (): Promise<CommandResult>
}

/**
 *  Represenation of a connection and state of a Viz Engine.
 */
export interface VizEngine {
	/** Hostname or IP address of a Viz Engine. */
	readonly hostname: string
	/** Alias for the engine's _handler_, the instance of an MSE _actor_ that is managing the Viz Engine. */
	readonly handler: string
	/** Status of the Viz Engine accoridng to the MSE handler. */
	readonly status: 'active' // add other states
	// TODO add the details of what is currently displayed according to the MSE
}

/**
 *  Representation of a MSE profile.
 */
export interface VProfile {
	/** Name of the profile, used as the target of commands. */
	name: string
	// TODO add other profile details
}

/**
 *  Representation of a MSE show.
 */
export interface VShow {
	/** UUID that identifies a show. */
	id: string
	// TOOD add other show details
}

/**
 *  Representation of a MSE playlist.
 */
export interface VPlaylist {
	name: string
	description: string
}

/**
 *  Location of a new XML element relative to an existing element.
 */
export enum LocationType {
	/** Insert a new element as the first child of a given parent. */
	First = 'first',
	/** Insert a new element as the last child of a given parent. */
	Last = 'last',
	/** Insert a new element before the given sibling */
	Before = 'before',
	/** Insert a new element after the given sibling. */
	After = 'after'
}

/**
 *  PepTalk protocol capabilities, a means of checking what a PepTalk-capable
 *  server can do.
 */
export enum Capability {
	peptalk = 'peptalk',
	noevents = 'noevents',
	uri = 'uri',
	xmlscheduling = 'xmlscheduling',
	xmlscheduling_feedback = 'xmlscheduling_feedback',
	pretty = 'pretty',
	prettycolors = 'prettycolors'
}

/**
 *  Representation of a message sent from a PepTalk server (an MSE).
 */
interface PepMessage {
	/** Identifier linking request to response, or `*` for an event. */
	id: number | '*'
	/** Status for a message. */
	status: 'ok' | 'unknown' | 'inexistent' | 'invalid' | 'not_allowed' | 'syntax' | 'unspecified'
	/** The message sent to the server. */
	sent?: string
}

interface PepResponse extends PepMessage {
	/** The body of the response recived from the server. */
	body: string
}

/**
 *  Error message provided when a PepTalk request rejects with an error.
 */
export interface PepError extends Error, PepMessage {
	/** Error-specific status messages. */
	status: 'inexistent' | 'invalid' | 'not_allowed' | 'syntax' | 'unspecified'
}

/**
 *  Error indicating that a given path does not exist.
 */
export interface InexistentError extends PepError {
	status: 'inexistent'
	/** Requested path that does not exist. */
	path: string
}

/**
 *  A request is invalid, either due to XML validation failure or failure to
 *  validate against the VDOM data model.
 */
export interface InvalidError extends PepError {
	status: 'invalid'
	description: string
}

/**
 *  A request makes sense but the operation is not allowed.
 */
export interface NotAllowedError extends PepError {
	status: 'not_allowed'
	reason: string
}

/**
 *  The server does not know the requested command.
 */
export interface SyntaxError extends PepError {
	status: 'syntax'
	description: string
}

/**
 *  All other kinds of error.
 */
export interface UnspecifiedError extends PepError {
	status: 'unspecified'
	description: string
}

/**
 *  Client interface for direct control of a PepTalk server such as the [[MSE]].
 *  A PepTalk client is an event EventEmitter that can be listened to for server
 *  events and errors.
 *
 *  Note that all messages are timed and if no response is received withint the
 *  timeout interval, the response promise will be rejected.
 */
export interface PepTalkClient extends EventEmitter {
	/** Timeout before a PepTalk request will fail. */
	readonly timeoutPep: number
	/** Number of messages sent from this client. Also used to generate message identifiers. */
	readonly counter: number
	/**
	 *  Open a connection to a server endpoint that supports PepTalk. A `protocol`
	 *  command will be sent as part of opening the connection, the response to which
	 *  will be included with the returned resolved promise.
	 *  @param noevents Set to true if the connection is not to receive server events.
	 *  @returns Resolves to the result of sending a protocol command to initiate
	 *  PepTalk.
	 */
	connect (noevents?: boolean): Promise<PepResponse>
	/**
	 *  Close an open PepTalk connection.
	 *  @returns Resolves on successful close.
	 */
	close (): Promise<PepResponse>
	/**
	 *  Test the connection to the PepTalk server.
	 *  @returns Resolves on successful connection test.
	 */
	pingPep (): Promise<PepResponse>
	/**
	 *  Send an unstructured request to a PepTalk server. This method should only
	 *  be used if none of the other methods of this interface are suitable.
	 *  @param message Message to send, excluding the unique message identifier.
	 *  @returns Resolves on a non-error response to the request.
	 */
	send (message: string): Promise<PepResponse>
	/**
	 *  Copy an element within the VDOM tree.
	 *  @param sourcePath Path the the source element to copy.
	 *  @param newPath New path for the element.
	 *  @param location Location within the parent or relative to a sibling.
	 *  @param sibling For relative location, path of the relative sibling.
	 *  @returns Resolves with the response to the request.
	 */
	copy (sourcePath: string, newPath: string, location: LocationType, sibling?: string): Promise<PepResponse>
	/**
	 *  Delete an element from the VDOM tree.
	 *  @param path Path to the element to delete.
	 *  @returns Resolves on a successful delete operation.
	 */
	delete (path: string): Promise<PepResponse>
	/**
	 *  Add nodes in the VDOM tree to ensure a given path will exist. All added nodes
	 *  are entries are of the form:
	 *
	 * ```
	 * <entry name="..."></entry>
	 * ```
	 * @path Path to ensure that all nested nodes exist.
	 * @returns Resolves on finding or successful creation of all the nested entries.
	 */
	ensurePath (path: string): Promise<PepResponse>
	/**
	 *  Retrieve the value of an entry in the VDOM tree at the given path.
	 *  @param path Path to the element to retrieve that value of.
	 *  @param depth Optional maximum depth of nested elements to retrieve.
	 *  @returns Resolves to an XML serialization of the requested value.
	 */
	get (path: string, depth?: number): Promise<PepResponse>
	/**
	 *  Insert a value into the VDOM tree.
	 *  @param path Full path of the element to insert.
	 *  @param xml Value of the element to insert serialized to XML.
	 *  @param location Location of the element relative to the parent or a sibling.
	 *  @param sibling Optional sibling for when location is specified by sibling.
	 *  @returns Resolves to the name of the newly inserted element that may have
	 *           been updated by the MSE.
	 */
	insert (path: string, xml: string, location: LocationType, sibling?: string): Promise<PepResponse>
	/**
	 *  Move a value within the VDOM tree.
	 *  @param oldPath Path to the existing element to move.
	 *  @param newPath New path for the moved element.
	 *  @param location Location of the moved element relative to the parent or a
	 *                  sibling.
	 *  @param sibling Optional sibling for when location is specified by sibling.
	 *  @returns Resolves to the name of the moved element that may have
	 *           been updated by the MSE.
	 */
	move (oldPath: string, newPath: string, location: LocationType, sibling?: string): Promise<PepResponse>
	/**
	 *  Request protocol capability and query what is available.
	 *  @param capability Capability or capabilities required.
	 *  @returns Resolves to a list of supported capabilities. Rejects if the
	 *           protocol is not available.
	 */
	protocol (capability: Capability | Capability[]): Promise<PepResponse>
	/**
	 *  Re-initializes the associated Media Sequencer, setting everything to its
	 *  initial state and initialising all logic.
	 *  @returns Resolves when re-initialization is complete.
	 */
	reintialize (): Promise<PepResponse>
	/**
	 *  Replace an element in the VDOM tree, an atomic delete and insert. If the
	 *  element to replace does not exist, this is equivalent to insert.
	 *  @param path Path the the element to be replaced.
	 *  @param xml  Serialized XML value to use to replace an existing value.
	 *  @returns Resolves to the name of the replaced element that may have
	 *           been updated by the MSE.
	 */
	replace (path: string, xml: string): Promise<PepResponse>
	/**
	 *  Set a text value in the VDOM tree, either the text content of an element or
	 *  the value of an attribute.
	 *  @param path           Path to the element for the value to be set.
	 *  @param textOrKey      Text content of an element or the name of the attribute.
	 *  @param attributeValue If seeting an attribute, the value to be set.
	 *  @returns Resolves with the value that has been set.
	 */
	set (path: string, textOrKey: string, attributeValue?: string): Promise<PepResponse>
	/**
	 *  Converts a VDOM path into a MSE HTTP URI path. (Not implemented on test system.)
	 *  @param path Path to the element to find by HTTP.
	 *  @param type _What this node represents._ Examples show `element_collection`.
	 *  @param base Optional base URL to use in the response.
	 *  @returns Resolves to the URI of the VDOM element via the MSE HTTP API.
	 */
	uri (path: string, type: string, base?: string): Promise<PepResponse>
	/** Details of all pending requests to the server. */
	pendingRequests: { [id: number]: PepMessage }
	/**
	 *  Set the timeout before a PepTalk request will be considered as failed.
	 *  @param t Timeout measured in milliseconds.
	 *  @returns The actual timeout value.
	 */
	setPepTimeout (t: number): number
	// PepTalk events
	/** Add a listener for all non-error messages and events from the server. */
	on (event: 'message', listener: (info: PepResponse) => void): this
	/** Add a listener for all error messages from the server. */
	on (event: 'error', listener: (err: PepError) => void): this
	// emit (event: 'message', info: PepResponse): boolean
	// emit (event: 'error', error: PepError): boolean
}

/**
 *  Client interface for sending commands to the MSE over HTTP.
 *
 *  Note that all messages are timed and if no response is received withint the
 *  timeout interval, the response promise will be rejected.
 */
export interface HttpMSEClient {
	readonly timeoutHttp: number
	/**
	 *  Send a command to the MSE over the HTTP interface. The MIME type is `text/plain`.
	 *  @param path The path to send the message to.
	 *  @param body The body of the message.
	 *  @returns Resolves for any successful (`200`) response.
	 */
	command (path: string | URL, body: string): Promise<CommandResult>
	/**
	 *  Test the connection to the MSE's HTTP API.
	 *  @returns Resolves on successful communication.
	 */
	pingHttp (): Promise<CommandResult>
	/**
	 *  Set the timeout before an HTTP request will fail.
	 *  @param t Timeout measured in milliseconds.
	 *  @returns The actual timeout value.
	 */
	setHTTPTimeout (t: number): number
}
/**
 *  Representation of a Media Sequencer Engine.
 *
 *  Implementations of this interface are expected to hold minimal state, requesting
 *  information from an MSE when it is required. Users of this interface should be
 *  aware that every call may take some time to complete.
 *
 *  [[VRundown|Rundowns]] are a v-connection concept held in local memory. It will
 *  be safe to recreate a rundown for a show in the event of a failure.
 */
export interface MSE extends PepTalkClient, HttpMSEClient {
	/** Hostname or IP address for the MSE. */
	readonly hostname: string
	/** Port for HTTP commands to the MSE. */
	readonly restPort: number
	/** Websocket port for PepTalk communication with the MSE. */
	readonly wsPort: number
	/**
	 *  Retrieve the details and controls for all rundowns of this MSE.
	 *  @returns List of rundowns for this MSE.
	 */
	getRundowns (): VRundown[]
	/**
	 * Retrieve a list of all Viz Engines with handlers at this MSE.
	 * @returns Resolves to a list of Viz Engine handlers for this MSE.
	 */
	getEngines (): Promise<VizEngine[]>
	/**
	 *  List the names of all the profiles for this MSE.
	 *  @returns List of the names of all the profiles known to this MSE.
	 */
	listProfiles (): Promise<string[]>
	/**
	 *  Retrieve the details of a specific profile at this MSE.
	 *  @param profileName Name of the profile to query.
	 *  @returns Resolves to the details of the named profile.
	 */
	getProfile (profileName: string): Promise<VProfile>
	/**
	 *  List the shows stored for this MSE.
	 *  @returns List of all the shows stored for this MSE.
	 */
	listShows (): Promise<string[]>
	/**
	 *  Retrieve details of a specific show as stored at this MSE.
	 *  @param showName Name of the show to query, a UUID.
	 *  @returns Resolves to the details of the named show.
	 */
	getShow (showName: string): Promise<VShow>
	/**
	 *  List the playlists stored for this MSE.
	 *  @returns Resolves to a list of playlists stored for this MSE.
	 */
	listPlaylists (): Promise<string[]>
	/**
	 *  Retrieve details of a specific playlist as stored at this MSE.
	 *  @param playlistName Name or UUID of a playlist to query.
	 *  @returns Resolves to the details of the named playlist.
	 */
	getPlaylist (playlistName: string): Promise<VPlaylist>
	/**
	 *  Create a new rundown to be executed on this MSE.
	 *  @param showID     Identifier of the show to create.
	 *  @param profile    Name of the profile to send commands to.
	 *  @param playlistID Optional UUID identifier for the playlist. If none is
	 *                    provided, one will be generated.
	 *  @return Resolves to a newly created rundown.
	 */
	createRundown (showID: string, profile: string, playlistID?: string): Promise<VRundown>
	/**
	 *  Delete a rundown from this MSE. Note that rundowns can only be deleted when
	 *  they are not activated.
	 *  @param showID Identifier of the show associated with the rundown.
	 *  @param profile Identifier of the profile associated with the rundown.
	 *  @returns Was the delete operation successful?
	 */
	deleteRundown (showID: string, profile: string): boolean
	/**
	 *  Create a new profile for this MSE. A profile associated a show with the
	 *  Vix Engine handlers that it controls, representing the current state of
	 *  a rundown.
	 *  @param profileName Name of the profile to create.
	 *  @param profileDetailsTbc TODO
	 *  @returns Resolves to provide details of the newly created profile.
	 */
	createProfile (profileName: string, profileDetailsTbc: any): Promise<VProfile>
	/**
	 *  Delete a profile fot this MSE. A profile cannot be deleted if an
	 *  associated rundown is active.
	 *  @param profileName Name of the profile to delete.
	 *  @returns Resolves `true` on successful deletion of the profile, or `false` if
	 *           the profile does not exist.
	 */
	deleteProfile (profileName: string): Promise<boolean>
	/**
	 *  Check the status of PepTalk websocket and HTTP API connections to the MSE.
	 *  @returns Resolves if both connections were successful.
	 */
	ping (): Promise<CommandResult>
	// Not creating shows - leave that to trio
	// Add methods here for MSE configuration
}

// TODO add an MSE factory
