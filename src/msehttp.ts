/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */

import { URL } from 'url'
import * as request from 'request-promise-native'

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
	async command (path: string | URL, body: string): Promise<CommandResult> {
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

	async ping (): Promise<CommandResult> {
		await request({
			method: 'GET',
			uri: this.baseURL,
			timeout: this.timeout
		})
		return { status: 200, response: 'PONG!' }
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
