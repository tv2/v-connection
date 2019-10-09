/**
 *  Module of utilities enabling communication with the PepTalk websocket interface
 *  of a Media Sequencer Engine.
 */

import { EventEmitter } from 'events'
import * as websocket from 'ws'

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


type PepErrorStatus = 'inexistent' | 'invalid' | 'not_allowed' | 'syntax' | 'unspecified' | 'timeout'

/**
 *  Representation of a message sent from a PepTalk server (an MSE).
 */
interface PepMessage {
	/** Identifier linking request to response, or `*` for an event. */
	id: number | '*'
	/** Status for a message. */
	status: 'ok' | PepErrorStatus
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
interface IPepError extends Error, PepMessage {
	/** Error-specific status messages. */
	status: PepErrorStatus
}

class PepError extends Error implements IPepError {
	readonly status: PepErrorStatus
	readonly id: number | '*'
	readonly sent?: string | undefined
	constructor (status: PepErrorStatus, id: number | '*', message?: string, sent?: string) {
		super(`PepTalk ${status} error for request ${id}${message ? ':' + message : '.'}`)
		this.status = status
		this.id = id
		this.sent = sent
	}
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
export interface IUnspecifiedError extends PepError {
	status: 'unspecified'
	description: string
}

class UnspecifiedError extends PepError implements IUnspecifiedError {
	readonly description: string
	readonly status: 'unspecified'
	constructor (id: number | '*', description: string, sent?: string) {
		super('unspecified', id, description, sent)
	}
}

export interface PendingRequest {
	id: number
	sent?: string
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
	/** Hostname or IP address of the MSE. */
	readonly hostname: string
	/** Port number of the HTTP interface of the MSE. Defaults to 8595. */
	readonly port: number
	/** Timeout before a PepTalk request will fail, measured in milliseconds. */
	readonly timeout: number
	/** Number of messages sent from this client. Also used to generate message identifiers. */
	readonly counter: number
	/** Details of all pending requests to the server. */
	readonly pendingRequests: { [id: number]: PendingRequest }

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
	emit (event: 'message', res: PepResponse): boolean
}

interface PendingRequestInternal extends PendingRequest {
	resolve (res: PepResponse): void
	reject (reason?: any): void
}

export class PepTalk extends EventEmitter implements PepTalkClient {
	private ws: Promise<websocket>
	readonly hostname: string
	readonly port: number
	timeout: number = 1000
	counter: number = 1
	pendingRequests: { [id: number]: PendingRequestInternal }

	constructor (hostname: string, port?: number) {
		super()
		this.hostname = hostname
		this.port = port ? port : 8595
	}

	private processMessage (m: string): void {
		let firstSpace = m.indexOf(' ')
		if (firstSpace <= 0) return
		let c = +m.slice(0, firstSpace)
		if (isNaN(c)) {
			if (m.startsWith('* ')) {
				this.emit('message', { id: '*', body: m, status: 'ok' } as PepResponse)
			} else {
				this.emit('error', new UnspecifiedError('*', `Unexpected message from server: '${m}'.`))
			}
			return // probably an event
		}
		let pending = this.pendingRequests[c]
		if (!pending) {
			this.emit('error', new UnspecifiedError(c, `Unmatched response for request ${c}.`))
		}
		if (m.slice(firstSpace + 1).startsWith('ok')) {
			let response: PepResponse = {
				id: pending.id,
				sent: pending.sent,
				status: 'ok',
				body: m.slice(firstSpace + 3)
			}
			pending.resolve(response)
			delete this.pendingRequests[c]
			this.emit('message', response)
			return
		}
		let errorIndex = m.indexOf('error')
		let error: PepError
		if (errorIndex < 0) {
			error = new UnspecifiedError(c, `Error message with unexpected format: '${m}'`, pending.sent)
		} else {
			let endOfErrorName = m.slice(errorIndex + 6).indexOf(' ')
			endOfErrorName = endOfErrorName > 0 ? endOfErrorName : m.length
			// TODO deal with each style of error
			error = new PepError(m.slice(errorIndex + 6, endOfErrorName) as PepErrorStatus,
				c, m, pending.sent)
		}
		pending.reject(error)
		delete this.pendingRequests[c]
		this.emit('error', error)
	}

	private failTimer (c: number): Promise<PepResponse> {
		return new Promise((_resolve, reject) => {
			setTimeout(() => {
				reject(new Error(`Parallel promise to send message ${c} did not resolve in time.`))
			}, this.timeout)
		})
	}

	private esc = (s: string) => `{${s.length}}${s}`

	private makeLocation (location: LocationType, sibling?: string) {
		if (location === LocationType.First || location === LocationType.Last) {
			return `${location}`
		} else {
			if (!sibling) {
				throw new UnspecifiedError(this.counter++, `Location '${location}' requested with no sibling path.`)
			}
			return `${location} ${this.esc(sibling)}`
		}

	}

	connect (noevents?: boolean | undefined): Promise<PepResponse> {
		this.ws = new Promise((resolve, reject) => {
			let ws = new websocket(`ws://${this.hostname}:${this.port}/`)
			ws.once('open', () => {
				ws.on('message', this.processMessage)
				resolve(ws)
			})
			ws.once('error', err => {
				reject(err)
			})
		})

		return this.send(noevents ? 'protocol peptalk noevents' : 'protocol peptalk')
	}

	close (): Promise<PepResponse> {
		return this.send('close')
	}

	pingPep (): Promise<PepResponse> {
		throw new Error('Method not implemented.')
	}

	send (message: string): Promise<PepResponse> {
		let c = this.counter++
		return Promise.race([
			this.failTimer(c),
			new Promise((resolve, reject) => {
				this.ws.then(s => { s.send(`${c} ${message}\r\n`) })
				this.pendingRequests[c] = { resolve, reject, id: c, sent: message }
			}) as Promise<PepResponse>
		])
	}

	copy (sourcePath: string, newPath: string, location: LocationType, sibling?: string | undefined): Promise<PepResponse> {
		try {
			return this.send(`copy ${this.esc(sourcePath)} ${this.esc(newPath)} ${this.makeLocation(location, sibling)}`)
		} catch (err) {
			return Promise.reject(err)
		}
	}

	delete (path: string): Promise<PepResponse> {
		return this.send(`delete ${this.esc(path)}`)
	}

	ensurePath (path: string): Promise<PepResponse> {
		return this.send(`ensure-path ${this.esc(path)}`)
	}

	get (path: string, depth?: number | undefined): Promise<PepResponse> {
		// TODO consider some XML processing
		return this.send(`get ${this.esc(path)}${depth ? ' ' + depth : ''}`)
	}

	insert (path: string, xml: string, location: LocationType, sibling?: string): Promise<PepResponse> {
		try {
			return this.send(`insert ${this.esc(path)} ${this.makeLocation(location, sibling)} ${this.esc(xml)}`)
		} catch (err) {
			return Promise.reject(err)
		}
	}

	move (oldPath: string, newPath: string, location: LocationType, sibling?: string | undefined): Promise<PepResponse> {
		try {
			return this.send(`move ${this.esc(oldPath)} ${this.esc(newPath)} ${this.makeLocation(location, sibling)}`)
		} catch (err) {
			return Promise.reject(err)
		}
	}

	protocol (capability: Capability | Capability[]): Promise<PepResponse> {
		if (!Array.isArray(capability)) {
			capability = [ capability ]
		}
		let list: string = capability.map(x => x.toString()).reduce((x, y) => `${x} ${y}`)
		return this.send(`protocol ${list}`)
	}

	reintialize (): Promise<PepResponse> {
		return this.send(`reinitialize`)
	}

	replace (path: string, xml: string): Promise<PepResponse> {
		return this.send(`replace ${this.esc(path)} ${this.esc(xml)}`)
	}

	set (path: string, textOrKey: string, attributeValue?: string): Promise<PepResponse> {
		if (attributeValue) {
			return this.send(`set attribute ${this.esc(path)} ${this.esc(textOrKey)} ${this.esc(attributeValue)}`)
		} else {
			return this.send(`set text ${this.esc(path)} ${this.esc(textOrKey)}`)
		}
	}

	uri (path: string, type: string, base?: string): Promise<PepResponse> {
		return this.send(`uri ${this.esc(path)} ${type}${base ? ' ' + base : ''}`)
	}

	setPepTimeout (t: number): number {
		throw new Error('Method not implemented.')
	}
}
