/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */

import { URL } from 'url'

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
