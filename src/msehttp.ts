/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */

import { URL } from 'url'
import * as request from 'request-promise-native'
import { ServerResponse } from 'http'

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
export interface IHTTPClientError extends Error, CommandResult { }

class HTTPClientError extends Error implements IHTTPClientError {
	readonly path: string
	readonly body?: string
	readonly status: number
	readonly response: string
	constructor (response: ServerResponse, path: string, body?: string) {
		super(`HTTP client error for '${path}': ${response.statusCode} - ${response.statusMessage}.`)
		this.path = path
		this.body = body
		this.status = response.statusCode
		this.response = response.statusMessage
	}
}

/** Server error - a `500` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface IHTTPServerError extends Error, CommandResult { }

class HTTPServerError extends Error implements IHTTPServerError {
	readonly path: string
	readonly body?: string
	readonly status: number
	readonly response: string
	constructor (response: ServerResponse, path: string, body?: string) {
		super(`HTTP server error for '${path}': ${response.statusCode} - ${response.statusMessage}.`)
		this.path = path
		this.body = body
		this.status = response.statusCode
		this.response = response.statusMessage
	}
}

export interface IHTTPRequestError extends Error, CommandResult { }

class HTTPRequestError extends Error implements IHTTPRequestError {
	readonly path: string
	readonly body?: string
	readonly status: number
	readonly response: string
	readonly baseURL: string
	constructor (message: string, baseURL: string, path: string, body?: string) {
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
 *  Note that all messages are timed and if no response is received withint the
 *  timeout interval, the response promise will be rejected.
 */
export interface HttpMSEClient {
	readonly host: string
	readonly port: number
	readonly timeout: number
	readonly profile: string
	/**
	 *  Send a command to the MSE over the HTTP interface. The MIME type is `text/plain`.
	 *  @param path The path to send the message to.
	 *  @param body The body of the message.
	 *  @returns Resolves for any successful (`200`) response.
	 */
	command (path: string | URL, body: string): Promise<CommandResult>

	cue (ref: string): Promise<CommandResult>
	take (ref: string): Promise<CommandResult>
	out (ref: string): Promise<CommandResult>
	continue (ref: string): Promise<CommandResult>
	continueReverse (ref: string): Promise<CommandResult>
	initializePlaylist (playlistID: string): Promise<CommandResult>
	cleanupPlaylist (playlistID: string): Promise<CommandResult>
	initialize (ref: string): Promise<CommandResult>

	/**
	 *  Test the connection to the MSE's HTTP API.
	 *  @returns Resolves on successful communication.
	 */
	ping (): Promise<CommandResult>
	/**
	 *  Set the timeout before an HTTP request will fail.
	 *  @param t Timeout measured in milliseconds.
	 *  @returns The actual timeout value.
	 */
	setHTTPTimeout (t: number): number
}

class MSEHTTP implements HttpMSEClient {
	readonly host: string
	readonly port: number
	timeout: number = 3000
	readonly profile: string
	private baseURL: string
	constructor (profile: string, host: string, port?: number) {
		this.port = port ? port : 8580
		this.host = host
		this.profile = profile
		this.baseURL = `http://${host}:${this.port}/profiles/${profile}`
	}

	private processError (err: any, path: string, body?: string): Error & CommandResult {
		if (!err.response) {
			if (err.name === 'RequestError') {
				return new HTTPRequestError(err.message, this.baseURL, path, body)
			} else {
				throw err
			}
		}
		let response = err.response as ServerResponse
		if (response.statusCode >= 400 && response.statusCode < 500) {
			return new HTTPClientError(response, path, body)
		}
		if (response.statusCode >= 500) {
			return new HTTPServerError(response, path, body)
		}
		throw err
	}

	async command (path: string | URL, body: string): Promise<CommandResult> {
		try {
			if (typeof path === 'string') {
				let response = await request.post({
					method: 'POST',
					uri: `${this.baseURL}/${path}`,
					body,
				 	timeout: this.timeout})
				return { status: 200, response: response.toString() } as CommandResult
			} else {
				let response = await request.post({
					method: 'POST',
					uri: path,
					body,
				 	timeout: this.timeout })
				return { status: 200, response: response.toString() } as CommandResult
			}
		} catch (err) {
			throw this.processError(err,
				typeof path === 'string' ? `${this.baseURL}/${path}` : path.toString(), body)
		}
	}

	cue (ref: string): Promise<CommandResult> {
		return this.command('cue', ref)
	}

	take (ref: string): Promise<CommandResult> {
		return this.command('take', ref)
	}

	out (ref: string): Promise<CommandResult> {
		return this.command('out', ref)
	}

	continue (ref: string): Promise<CommandResult> {
		return this.command('continue', ref)
	}

	continueReverse (ref: string): Promise<CommandResult> {
		return this.command('continue-reverse', ref)
	}

	initializePlaylist (playlistID: string): Promise<CommandResult> {
		return this.command('initialize', `/storage/playlists/{${playlistID}}`)
	}

	cleanupPlaylist (playlistID: string): Promise<CommandResult> {
		return this.command('cleanup', `/storage/playlists/{${playlistID}}`)
	}

	initialize (ref: string): Promise<CommandResult> { // initialize a single element
		return this.command('initialize', ref)
	}

	async ping (): Promise<CommandResult> {
		try {
			await request.get({
				method: 'GET',
				uri: this.baseURL,
				timeout: this.timeout
			})
			return { status: 200, response: 'PONG!' } as CommandResult
		} catch (err) {
			throw this.processError(err, '')
		}
	}

	setHTTPTimeout (t: number): number {
		if (t > 0) {
			this.timeout = t
		}
		return this.timeout
	}
}

export function createHTTPContext (profile: string, host: string, port?: number): HttpMSEClient {
	return new MSEHTTP(profile, host, port)
}
