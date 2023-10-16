/**
 *  Module of utilities enabling communication with the PepTalk websocket interface
 *  of a Media Sequencer Engine.
 */

import { EventEmitter } from 'events'
import * as websocket from 'ws'
import * as Xml2JS from 'xml2js'

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
	After = 'after',
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
	prettycolors = 'prettycolors',
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

export interface PepResponse extends PepMessage {
	/** The body of the response recived from the server. */
	body: string
}

/**
 *  Error message provided when a PepTalk request rejects with an error.
 */
export interface IPepError extends Error, PepMessage {
	/** Error-specific status messages. */
	status: PepErrorStatus
}

export function isIPepError(err: Error): err is IPepError {
	return Object.prototype.hasOwnProperty.call(err, 'status')
}

class PepError extends Error implements IPepError {
	readonly status: PepErrorStatus
	readonly id: number | '*'
	readonly sent?: string | undefined
	constructor(status: PepErrorStatus, id: number | '*', message?: string, sent?: string) {
		super(`PepTalk ${status} error for request ${id}${message ? ': ' + message : '.'}`)
		this.status = status
		this.id = id
		this.sent = sent
	}
}

/**
 *  Error indicating that a given path does not exist.
 */
export interface IInexistentError extends PepError {
	status: 'inexistent'
	/** Requested path that does not exist. */
	path: string
}

export class InexistentError extends PepError implements IInexistentError {
	readonly status: 'inexistent' = 'inexistent'
	readonly path: string
	constructor(id: number, path: string, sent?: string) {
		super('inexistent', id, `PepTalk inexistent error: Could not locate element at ${path}.`, sent)
		this.path = path
	}
}

/**
 *  A request is invalid, either due to XML validation failure or failure to
 *  validate against the VDOM data model.
 */
export interface IInvalidError extends PepError {
	status: 'invalid'
	description: string
}

export class InvalidError extends PepError implements IInvalidError {
	readonly status: 'invalid' = 'invalid'
	readonly description: string
	constructor(id: number, description: string, sent?: string) {
		super('invalid', id, `Validation error: ${description}.`, sent)
		this.description = description
	}
}

/**
 *  A request makes sense but the operation is not allowed.
 */
export interface INotAllowedError extends PepError {
	status: 'not_allowed'
	reason: string
}

export class NotAllowedError extends PepError implements INotAllowedError {
	readonly status: 'not_allowed' = 'not_allowed'
	readonly reason: string
	constructor(id: number, reason: string, sent?: string) {
		super('not_allowed', id, `Request understood put not allowed: ${reason}.`, sent)
		this.reason = reason
	}
}

/**
 *  The server does not know the requested command.
 */
export interface ISyntaxError extends PepError {
	status: 'syntax'
	description: string
}

export class SyntaxError extends PepError implements ISyntaxError {
	readonly status: 'syntax' = 'syntax'
	readonly description: string
	constructor(id: number, description: string, sent?: string) {
		super('syntax', id, `Syntax error in request: ${description}.`, sent)
		this.description = description
	}
}

/**
 *  All other kinds of error.
 */
export interface IUnspecifiedError extends PepError {
	status: 'unspecified'
	description: string
}

export class UnspecifiedError extends PepError implements IUnspecifiedError {
	readonly description: string
	readonly status: 'unspecified' = 'unspecified'
	constructor(id: number | '*', description: string, sent?: string) {
		super('unspecified', id, description, sent)
		this.description = description
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
	connect(noevents?: boolean): Promise<PepResponse>
	/**
	 *  Close an open PepTalk connection.
	 *  @returns Resolves on successful close.
	 */
	close(): Promise<PepResponse>
	/**
	 *  Test the connection to the PepTalk server.
	 *  @returns Resolves on successful connection test with body `PONG!`.
	 */
	ping(): Promise<PepResponse>
	/**
	 *  Send an unstructured request to a PepTalk server. This method should only
	 *  be used if none of the other methods of this interface are suitable.
	 *  @param message Message to send, excluding the unique message identifier.
	 *  @returns Resolves on a non-error response to the request.
	 */
	send(message: string): Promise<PepResponse>
	/**
	 *  Copy an element within the VDOM tree.
	 *  @param sourcePath Path the the source element to copy.
	 *  @param newPath New path for the element.
	 *  @param location Location within the parent or relative to a sibling.
	 *  @param sibling For relative location, path of the relative sibling.
	 *  @returns Resolves with the response to the request.
	 */
	copy(sourcePath: string, newPath: string, location: LocationType, sibling?: string): Promise<PepResponse>
	/**
	 *  Delete an element from the VDOM tree.
	 *  @param path Path to the element to delete.
	 *  @returns Resolves on a successful delete operation.
	 */
	delete(path: string): Promise<PepResponse>
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
	ensurePath(path: string): Promise<PepResponse>
	/**
	 *  Retrieve the value of an entry in the VDOM tree at the given path.
	 *  @param path Path to the element to retrieve that value of.
	 *  @param depth Optional maximum depth of nested elements to retrieve.
	 *  @returns Resolves to an XML serialization of the requested value.
	 */
	get(path: string, depth?: number): Promise<PepResponse>
	/**
	 *  Insert a value into the VDOM tree.
	 *  @param path Full path of the element to insert.
	 *  @param xml Value of the element to insert serialized to XML.
	 *  @param location Location of the element relative to the parent or a sibling.
	 *  @param sibling Optional sibling for when location is specified by sibling.
	 *  @returns Resolves to the name of the newly inserted element that may have
	 *           been updated by the MSE.
	 */
	insert(path: string, xml: string, location: LocationType, sibling?: string): Promise<PepResponse>
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
	move(oldPath: string, newPath: string, location: LocationType, sibling?: string): Promise<PepResponse>
	/**
	 *  Request protocol capability and query what is available.
	 *  @param capability Capability or capabilities required. None to get list.
	 *  @returns Resolves to a list of supported capabilities. Rejects if the
	 *           protocol is not available.
	 */
	protocol(capability?: Capability | Capability[]): Promise<PepResponse>
	/**
	 *  Re-initializes the associated Media Sequencer, setting everything to its
	 *  initial state and initialising all logic.
	 *  @returns Resolves when re-initialization is complete.
	 */
	reintialize(): Promise<PepResponse>
	/**
	 *  Replace an element in the VDOM tree, an atomic delete and insert. If the
	 *  element to replace does not exist, this is equivalent to insert.
	 *  @param path Path the the element to be replaced.
	 *  @param xml  Serialized XML value to use to replace an existing value.
	 *  @returns Resolves to the name of the replaced element that may have
	 *           been updated by the MSE.
	 */
	replace(path: string, xml: string): Promise<PepResponse>
	/**
	 *  Set a text value in the VDOM tree, either the text content of an element or
	 *  the value of an attribute.
	 *  @param path           Path to the element for the value to be set.
	 *  @param textOrKey      Text content of an element or the name of the attribute.
	 *  @param attributeValue If seeting an attribute, the value to be set.
	 *  @returns Resolves with the value that has been set.
	 */
	set(path: string, textOrKey: string, attributeValue?: string): Promise<PepResponse>
	/**
	 *  Converts a VDOM path into a MSE HTTP URI path.
	 *  @param path Path to the element to find by HTTP.
	 *  @param type _What this node represents._ Examples show `element_collection`.
	 *  @param base Optional base URL to use in the response.
	 *  @returns Resolves to the URI of the VDOM element via the MSE HTTP API.
	 */
	uri(path: string, type: string, base?: string): Promise<PepResponse>
	/**
	 *  Set the timeout before a PepTalk request will be considered as failed.
	 *  @param t Timeout measured in milliseconds.
	 *  @returns The actual timeout value.
	 */
	setTimeout(t: number): number
	// PepTalk events
	/** Add a listener for all non-error messages and events from the server. */
	on(event: 'message', listener: (info: PepResponse) => void): this
	/** Add a listener for all error messages from the server. */
	on(event: 'error', listener: (err: PepError) => void): this
	/** Add a listener for close event of the websocket connection. */
	on(event: 'close', listener: () => void): this
	// emit (event: 'message', info: PepResponse): boolean
	// emit (event: 'error', error: PepError): boolean
	emit(event: 'message', res: PepResponse): boolean
}

/** [[PepResponse]] with additional Javascript representation. */
export interface PepResponseJS extends PepResponse {
	/** Javascript representation of the response [[body]]. */
	js: Record<string, unknown>
}

/**
 *  Additional methods for accessing VDOM tree elements are Javascript objects.
 */
export interface PepTalkJS {
	/**
	 *  Retrieve the value of an entry in the VDOM tree at the given path,
	 *  converting the returned XML value into a flattenned Javascript object.
	 *  @param path Path to the element in the VDOM tree.
	 *  @param depth Optional maximum depth of nested elements to retrieve.
	 *  @returns Resolves to an Javascript representation of the requested value.
	 */
	getJS(path: string, depth?: number): Promise<PepResponseJS>
}

interface PendingRequestInternal extends PendingRequest {
	resolve(res: PepResponse): void
	reject(reason?: any): void
}

interface Leftover {
	previous: string
	remaining: number
}

class PepTalk extends EventEmitter implements PepTalkClient, PepTalkJS {
	private ws: Promise<websocket | null> = Promise.resolve(null)
	readonly hostname: string
	readonly port: number
	timeout = 3000
	counter = 1
	pendingRequests: { [id: number]: PendingRequestInternal } = {}

	private leftovers: Leftover | null = null

	constructor(hostname: string, port?: number) {
		super()
		this.hostname = hostname
		this.port = port ? port : 8595
	}

	private processChunk(m: string): void {
		let split = m.replace(/^\r\n|\r\n$/g, '').split('\r\n')
		if (split.length === 0) return
		const re = /\{(\d+)\}/g
		const last = split[split.length - 1]
		let reres = re.exec(last)
		let leftovers: Leftover | null = null
		// console.log('SBF >>>', split)
		while (reres !== null) {
			const lastBytes = Buffer.byteLength(last, 'utf8')
			if (lastBytes - (reres.index + reres[0].length + +reres[1]) < 0) {
				leftovers = {
					previous: last,
					remaining: +reres[1] - lastBytes + reres[0].length + reres.index,
				}
				split = split.slice(0, -1)
				break
			}
			reres = re.exec(last)
		}
		// console.log('SAF >>>', split)
		if (this.leftovers) {
			if (Array.isArray(split) && split.length > 0) {
				this.leftovers.previous = this.leftovers.previous + split[0]
				this.leftovers.remaining -= Buffer.byteLength(split[0], 'utf8')
				if (this.leftovers.remaining <= 0) {
					split[0] = this.leftovers.previous
					this.leftovers = null
				} else {
					return
				}
			} else if (leftovers) {
				leftovers.previous = this.leftovers.previous + leftovers.previous
			}
		}
		this.leftovers = leftovers ? leftovers : this.leftovers
		if (split.length > 1) {
			for (const sm of split) {
				// console.log('smsm >>>', sm)
				if (sm.length > 0) this.processMessage(sm)
			}
			return
		}
		if (split.length === 0) return
		m = split[0]
		this.processMessage(m)
	}

	private processMessage(m: string): void {
		const firstSpace = m.indexOf(' ')
		if (firstSpace <= 0) return
		const c = +m.slice(0, firstSpace)
		if (isNaN(c) || m.slice(firstSpace + 1).startsWith('begin')) {
			if (m.startsWith('* ') || m.slice(firstSpace + 1).startsWith('begin')) {
				this.emit('message', { id: '*', body: m, status: 'ok' } as PepResponse)
			} else {
				try {
					this.emit('error', new UnspecifiedError('*', `Unexpected message from server: '${m}'.`))
				} catch (err) {
					/* Allow emit with no listeners. */
				}
			}
			return // probably an event
		}
		const pending = this.pendingRequests[c]
		if (!pending) {
			try {
				this.emit('error', new UnspecifiedError(c, `Unmatched response for request ${c}.`))
			} catch (err) {
				/* Allow emit with no listeners. */
			}
			return // everything beyond here needs pending to be set
		}
		if (m.slice(firstSpace + 1).startsWith('ok')) {
			const response: PepResponse = {
				id: pending.id,
				sent: pending.sent,
				status: 'ok',
				body: this.unesc(m.slice(firstSpace + 4)).trim(),
			}
			pending.resolve(response)
			delete this.pendingRequests[c]
			this.emit('message', response)
			if (pending.sent === 'close') {
				this.ws = Promise.resolve(null)
			}
			return
		}
		if (m.slice(firstSpace + 1).startsWith('protocol')) {
			const response: PepResponse = {
				id: pending.id,
				sent: pending.sent,
				status: 'ok',
				body: this.unesc(m.slice(firstSpace + 1)).trim(),
			}
			pending.resolve(response)
			delete this.pendingRequests[c]
			this.emit('message', response)
			return
		}
		const errorIndex = m.indexOf('error')
		let error: PepError
		if (errorIndex < 0 || errorIndex > 10) {
			error = new UnspecifiedError(
				c,
				`Error message with unexpected format: '${m}'`,
				pending && pending.sent ? pending.sent : 'sent is undefined'
			)
		} else {
			let endOfErrorName = m.slice(errorIndex + 6).indexOf(' ') + errorIndex + 6
			endOfErrorName = endOfErrorName > errorIndex + 6 ? endOfErrorName : m.length
			switch (m.slice(errorIndex + 6, endOfErrorName)) {
				case 'inexistent':
				case 'inexist':
					error = new InexistentError(c, m.slice(endOfErrorName + 1), pending.sent)
					break
				case 'invalid':
					error = new InvalidError(c, m.slice(endOfErrorName + 1), pending.sent)
					break
				case 'not_allowed':
					error = new NotAllowedError(c, m.slice(endOfErrorName + 1), pending.sent)
					break
				case 'syntax':
					error = new SyntaxError(c, m.slice(endOfErrorName + 1), pending.sent)
					break
				case 'unspecified':
					error = new UnspecifiedError(c, m.slice(endOfErrorName + 1), pending.sent)
					break
				default:
					error = new PepError(m.slice(errorIndex + 6, endOfErrorName) as PepErrorStatus, c, m, pending.sent)
					break
			}
		}
		pending.reject(error)
		delete this.pendingRequests[c]
		try {
			this.emit('error', error)
		} catch (err) {
			/* Allow emit with no listeners. */
		}
	}

	private async failTimer(c: number, message: string): Promise<PepResponse> {
		return new Promise((_resolve, reject) => {
			setTimeout(() => {
				reject(new Error(`Parallel promise to send message ${c} did not resolve in time. Message: ${message}`))
			}, this.timeout)
		})
	}

	/** Escape a string using plaintalk representation. */
	private esc = (s: string) => `{${Buffer.byteLength(s, 'utf8')}}${s}`

	/** Remove all plaintalk escaping from a string. */
	private unesc = (s: string) => s.replace(/\{\d+\}/g, '')

	private makeLocation(location: LocationType, sibling?: string) {
		if (location === LocationType.First || location === LocationType.Last) {
			return `${location}`
		} else {
			if (!sibling) {
				throw new UnspecifiedError(this.counter++, `Location '${location}' requested with no sibling path.`)
			}
			return `${location} ${this.esc(sibling)}`
		}
	}

	async connect(noevents?: boolean | undefined): Promise<PepResponse> {
		this.ws = new Promise((resolve, reject) => {
			// console.log('<<<', `ws://${this.hostname}:${this.port}/`)
			const ws = new websocket(`ws://${this.hostname}:${this.port}/`)
			ws.once('open', () => {
				ws.on('message', this.processChunk.bind(this))
				resolve(ws)
			})
			const close = (err?: any) => {
				ws.removeAllListeners()
				if (!err) this.ws = Promise.resolve(null)
				reject(err)
				this.emit('close')
			}
			ws.once('error', (err) => {
				close(err)
			})
			ws.once('close', () => {
				close()
			})
		})

		return this.send(noevents ? 'protocol peptalk noevents' : 'protocol peptalk')
	}

	async close(): Promise<PepResponse> {
		return this.send('close')
	}

	async ping(): Promise<PepResponse> {
		const pingTest = await this.get('/', 0)
		if (pingTest.body.indexOf('<entry') >= 0) {
			pingTest.body = 'PONG!'
			return pingTest
		} else {
			throw new UnspecifiedError(pingTest.id, 'Unexpected response to ping request.')
		}
	}

	async send(message: string): Promise<PepResponse> {
		const c = this.counter++
		return Promise.race([
			this.failTimer(c, message),
			new Promise((resolve: (res: PepResponse) => void, reject: (reason?: any) => void) => {
				this.ws
					.then((s) => {
						if (s === null) {
							reject(new Error('Not connected.'))
						} else {
							s.send(`${c} ${message}\r\n`)
						}
					})
					.catch((err) => {
						reject(new UnspecifiedError('*', `Unexpected send error from websocket: ${err.message}`, message))
					})
				this.pendingRequests[c] = { resolve, reject, id: c, sent: message }
			}),
		])
	}

	async copy(
		sourcePath: string,
		newPath: string,
		location: LocationType,
		sibling?: string | undefined
	): Promise<PepResponse> {
		return this.send(`copy ${this.esc(sourcePath)} ${this.esc(newPath)} ${this.makeLocation(location, sibling)}`)
	}

	async delete(path: string): Promise<PepResponse> {
		return this.send(`delete ${this.esc(path)}`)
	}

	async ensurePath(path: string): Promise<PepResponse> {
		return this.send(`ensure-path ${this.esc(path)}`)
	}

	async get(path: string, depth?: number): Promise<PepResponse> {
		return this.send(`get ${this.esc(path)}${depth !== undefined ? ' ' + depth : ''}`)
	}

	async insert(path: string, xml: string, location: LocationType, sibling?: string): Promise<PepResponse> {
		return this.send(`insert ${this.esc(path)} ${this.makeLocation(location, sibling)} ${this.esc(xml)}`)
	}

	async move(
		oldPath: string,
		newPath: string,
		location: LocationType,
		sibling?: string | undefined
	): Promise<PepResponse> {
		return this.send(`move ${this.esc(oldPath)} ${this.esc(newPath)} ${this.makeLocation(location, sibling)}`)
	}

	async protocol(capability?: Capability | Capability[]): Promise<PepResponse> {
		if (!capability) {
			capability = []
		} else if (!Array.isArray(capability)) {
			capability = [capability]
		}
		const list: string = capability
			.map((x) => x.toString())
			.reduce((x, y) => `${x} ${y}`, '')
			.trim()
		return this.send(`protocol${list.length > 0 ? ' ' : ''}${list}`)
	}

	async reintialize(): Promise<PepResponse> {
		return this.send('reinitialize')
	}

	async replace(path: string, xml: string): Promise<PepResponse> {
		return this.send(`replace ${this.esc(path)} ${this.esc(xml)}`)
	}

	async set(path: string, textOrKey: string, attributeValue?: string): Promise<PepResponse> {
		if (attributeValue) {
			return this.send(`set attribute ${this.esc(path)} ${this.esc(textOrKey)} ${this.esc(attributeValue)}`)
		} else {
			return this.send(`set text ${this.esc(path)} ${this.esc(textOrKey)}`)
		}
	}

	async uri(path: string, type: string, base?: string): Promise<PepResponse> {
		return this.send(`uri ${this.esc(path)} ${this.esc(type)}${base ? ' ' + this.esc(base) : ''}`)
	}

	setTimeout(t: number): number {
		if (t > 0) this.timeout = t
		return this.timeout
	}

	async getJS(path: string, depth?: number): Promise<PepResponseJS> {
		const result: PepResponseJS = (await this.get(path, depth)) as PepResponseJS
		result.js = await Xml2JS.parseStringPromise(result.body)
		return result
	}
}

export function startPepTalk(hostname: string, port?: number): PepTalkClient & PepTalkJS {
	return new PepTalk(hostname, port)
}

/** Converts an error thrown by peptalk into a string */
export function getPepErrorMessage(err: unknown): string {
	return (typeof err === 'object' && ((err as any).message || err?.toString())) || `${err}`
}
