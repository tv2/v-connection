/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */

import { URL } from 'url'
import got from 'got'
import { ServerResponse } from 'http'

export const uuidRe = /[a-fA-f0-9]{8}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{12}/

/** Result of executing an HTTP command. Command promise is resolved. */
export interface CommandResult {
	/** HTTP command or URL */
	path: string
	/** HTTP request body */
	body?: string
	/** HTTP status code. Normally `200 OK`. */
	status: number
	/** Response received. */
	response: string
}

/** Client error - a `400` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface IHTTPClientError extends Error, CommandResult {}

export class HTTPClientError extends Error implements IHTTPClientError {
	readonly path: string
	readonly body?: string
	readonly status: number
	readonly response: string
	constructor(response: ServerResponse, path: string, body?: string) {
		super(`HTTP client error for '${path}': ${response.statusCode} - ${response.statusMessage}.`)
		this.path = path
		this.body = body
		this.status = response.statusCode
		this.response = response.statusMessage
	}
}

/** Server error - a `500` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface IHTTPServerError extends Error, CommandResult {}

export class HTTPServerError extends Error implements IHTTPServerError {
	readonly path: string
	readonly body?: string
	readonly status: number
	readonly response: string
	constructor(response: ServerResponse, path: string, body?: string) {
		super(`HTTP server error for '${path}': ${response.statusCode} - ${response.statusMessage}.`)
		this.path = path
		this.body = body
		this.status = response.statusCode
		this.response = response.statusMessage
	}
}

export interface IHTTPRequestError extends Error, CommandResult {}

export class HTTPRequestError extends Error implements IHTTPRequestError {
	readonly path: string
	readonly body?: string
	readonly status: number
	readonly response: string
	readonly baseURL: string
	constructor(message: string, baseURL: string, path: string, body?: string) {
		super(`HTTP request error for '${path}': ${message}.`)
		this.baseURL = baseURL
		this.path = path
		this.body = body
		this.status = 418
		this.response = message
	}
}

/**
 *  Client interface for sending commands to the MSE over HTTP. Commands target
 *  a specific profile.
 *
 *  Note that all messages are timed and if no response is received within the
 *  timeout interval, the response promise will be rejected.
 */
export interface HttpMSEClient {
	readonly host: string
	readonly port: number
	readonly timeout: number
	readonly profile: string
	readonly baseURL: string
	/**
	 *  Send a command to the MSE over the HTTP interface. The MIME type is `text/plain`.
	 *  @param path The path to send the message to.
	 *  @param body The body of the message.
	 *  @returns Resolves for any successful (`200`) response.
	 */
	command(path: string | URL, body: string): Promise<CommandResult>

	/**
	 *  Cue an element ready to be taken. Cueing an element:
	 *  1. If not already loaded, loads all graphical resources onto the Viz
	 *     engine. May take several seconds.
	 *  2. Starts the first frame of the graphic on the fill output, removing any
	 *     other current element.
	 *  3. Sets the key output to transparent.
	 *  @param ref Path of element to cue, e.g. `/external/elements/pilotdb/1234567`
	 *  @returns Resolves if a cue has been scheduled. Note this is not when the element
	 *           has been cued.
	 */
	cue(ref: string): Promise<CommandResult>
	/**
	 *  Take an element to air. If not already loaded, loads all the graphical resources
	 *  onto the VizEngine (may take several seconds) and starts the element's
	 *  animation.
	 *  @param ref Path of element to cue, e.g. `/storage/shows/showID/elements/ident`
	 *  @returns Resolves if a take has been scheduled. Note that this is not when
	 *           the element starts animating.
	 */
	take(ref: string): Promise<CommandResult>
	/**
	 *  Take an element off air.
	 *  @param ref Path of an element to take out.
	 *  @returns Resolves if an out has been scheduled. Note that this is not either when
	 *           the element has been taken out or has started its final animation.
	 */
	out(ref: string): Promise<CommandResult>
	/**
	 *  For a graphical element with multiple continue states, start the animation
	 *  to the next state.
	 *  Warning: do not do this out-of-sequence as it can have side effects.
	 *  @param ref Path of an element to continue the state of.
	 *  @returns Resolves if a continue has been scheduled.
	 */
	continue(ref: string): Promise<CommandResult>
	/**
	 *  For a graphical element with multiple continue states, rewind the animation
	 *  to the previous state.
	 *  @param ref Path of an element to reverse continue.
	 *  @returns Resolves if a continue reverse has been scheduled.
	 */
	continueReverse(ref: string): Promise<CommandResult>
	/**
	 *  Initialize and activate the playlist with the given identifier.
	 *  Activating a playlist causes any associated exterrnal elements to be built
	 *  and maintained within the MSE.
	 *  @param playlistID Identifier of the playlist to initialize and activate. Normally,
	 *                    this is a UUID value not enclosed in curly braces.
	 *  @returns Resolves if the playlist initialization and activation has been
	 *           scheduled. Note that this is not when the playlist becomes active.
	 */
	initializePlaylist(playlistID: string): Promise<CommandResult>
	/**
	 *  Initialize and activate the show with the given identifier.
	 *  Activating a show causes associated resources to load onto the engines
	 *  associated with the active profile.
	 *  @param showID Identifier of the show to initialize and activate. Normally,
	 *                this is a UUID value not enclosed in curly braces.
	 *  @returns Resolves if the show initialization and activation has been
	 *           scheduled. Note that this is not when the playlist becomes active.
	 */
	initializeShow(showID: string): Promise<CommandResult>
	/**
	 *  Cleanup the playlist with the given identifier.
	 *  Deactivating a playlist will stop the active maintenance of its referenced
	 *  elements by the MSE.
	 *  @param playlistID Identifier of the playlist to cleanup and deactivate. Normally,
	 *                    this is a UUID value not enclosed in curly braces.
	 *  @returns Resolves if the playlist cleanup and deactivation has been
	 *           scheduled. Note that this is not when the playlist is no longer active.
	 */
	cleanupPlaylist(playlistID: string): Promise<CommandResult>
	/**
	 *  Clean up the elements associated with a show and its profile. This will
	 *  also reset the associated renderers (VizEngines).
	 *  @param showID Identifier for a show.  Normally,
	 *                this is a UUID value not enclosed in curly braces.
	 *  @returns Resolves if the show cleanup and deactivation has been
	 *           scheduled. Note that this is not when the show is no longer active.
	 */
	cleanupShow(showID: string): Promise<CommandResult>
	/**
	 *  Initialize a single element. Only works for external element references
	 *  in playlists, causing any resources required by the element to be loaded
	 *  onto the appropriate VizEngine.
	 *  @param ref Path of an element to initialize.
	 *  @returns Resolves when the request to make the element has been made and
	 *           the element can be initialized.
	 */
	initialize(ref: string): Promise<CommandResult>

	/**
	 *  Test the connection to the MSE's HTTP API.
	 *  @returns Resolves on successful communication.
	 */
	ping(): Promise<CommandResult>
	/**
	 *  Set the timeout before an HTTP request will fail.
	 *  @param t Timeout measured in milliseconds.
	 *  @returns The actual timeout value.
	 */
	setHTTPTimeout(t: number): number
}

class MSEHTTP implements HttpMSEClient {
	readonly host: string
	readonly port: number
	timeout = 3000
	readonly profile: string
	readonly baseURL: string
	constructor(profile: string, host: string, port?: number) {
		this.port = port ? port : 8580
		this.host = host
		this.profile = profile
		this.baseURL = `http://${host}:${this.port}/profiles/${profile}`
	}

	private processError(err: any, path: string, body?: string): Error & CommandResult {
		if (!err.response) {
			if (err.name === 'RequestError') {
				return new HTTPRequestError(err.message, this.baseURL, path, body)
			} else {
				throw err
			}
		}
		const response = err.response as ServerResponse
		if (response.statusCode >= 400 && response.statusCode < 500) {
			return new HTTPClientError(response, path, body)
		}
		if (response.statusCode >= 500) {
			return new HTTPServerError(response, path, body)
		}
		throw err
	}

	async command(path: string | URL, body: string): Promise<CommandResult> {
		try {
			if (typeof path === 'string') {
				const response = await got({
					method: 'POST',
					url: `${this.baseURL}/${path}`,
					body,
					timeout: this.timeout,
					headers: {
						'Content-Type': 'text/plain',
					},
				})
				return { status: 200, response: response.body.toString() } as CommandResult
			} else {
				const response = await got({
					method: 'POST',
					url: path.toString(),
					body,
					timeout: this.timeout,
					headers: {
						'Content-Type': 'text/plain',
					},
				})
				return { status: 200, response: response.body.toString() } as CommandResult
			}
		} catch (err) {
			throw this.processError(err, typeof path === 'string' ? `${this.baseURL}/${path}` : path.toString(), body)
		}
	}

	async cue(ref: string): Promise<CommandResult> {
		return this.command('cue', ref)
	}

	async take(ref: string): Promise<CommandResult> {
		return this.command('take', ref)
	}

	async out(ref: string): Promise<CommandResult> {
		return this.command('out', ref)
	}

	async continue(ref: string): Promise<CommandResult> {
		return this.command('continue', ref)
	}

	async continueReverse(ref: string): Promise<CommandResult> {
		return this.command('continue_reverse', ref)
	}

	async initializePlaylist(playlistID: string): Promise<CommandResult> {
		return this.command('initialize', `/storage/playlists/{${playlistID}}`)
	}

	async initializeShow(showID: string): Promise<CommandResult> {
		return this.command('initialize', `/storage/shows/{${showID}}`)
	}

	async cleanupPlaylist(playlistID: string): Promise<CommandResult> {
		return this.command('cleanup', `/storage/playlists/{${playlistID}}`)
	}

	async cleanupShow(showID: string): Promise<CommandResult> {
		return this.command('cleanup', `/storage/shows/{${showID}}`)
	}

	async initialize(ref: string): Promise<CommandResult> {
		// initialize a single element
		return this.command('initialize', ref)
	}

	async ping(): Promise<CommandResult> {
		try {
			await got({
				method: 'GET',
				url: this.baseURL,
				timeout: this.timeout,
			})
			return { status: 200, response: 'PONG!' } as CommandResult
		} catch (err) {
			throw this.processError(err, '')
		}
	}

	setHTTPTimeout(t: number): number {
		if (t > 0) {
			this.timeout = t
		}
		return this.timeout
	}
}

export function createHTTPContext(profile: string, host: string, port?: number): HttpMSEClient {
	return new MSEHTTP(profile, host, port)
}
