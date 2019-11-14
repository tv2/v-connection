/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */
/// <reference types="node" />
import { URL } from 'url';
export declare const uuidRe: RegExp;
/** Result of executing an HTTP command. Command promise is resolved. */
export interface CommandResult {
    /** HTTP command or URL */
    path: string;
    /** HTTP request body */
    body?: string;
    /** HTTP status code. Normally `200 OK`. */
    status: number;
    /** Response received. */
    response: string;
}
/** Client error - a `400` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface IHTTPClientError extends Error, CommandResult {
}
/** Server error - a `500` code - resulting from an HTTP command. Commnd promise is rejected. */
export interface IHTTPServerError extends Error, CommandResult {
}
export interface IHTTPRequestError extends Error, CommandResult {
}
/**
 *  Client interface for sending commands to the MSE over HTTP. Commands target
 *  a specific profile.
 *
 *  Note that all messages are timed and if no response is received within the
 *  timeout interval, the response promise will be rejected.
 */
export interface HttpMSEClient {
    readonly host: string;
    readonly port: number;
    readonly timeout: number;
    readonly profile: string;
    /**
     *  Send a command to the MSE over the HTTP interface. The MIME type is `text/plain`.
     *  @param path The path to send the message to.
     *  @param body The body of the message.
     *  @returns Resolves for any successful (`200`) response.
     */
    command(path: string | URL, body: string): Promise<CommandResult>;
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
    cue(ref: string): Promise<CommandResult>;
    /**
     *  Take an element to air. If not already loaded, loads all the graphical resources
     *  onto the VizEngine (may take several seconds) and starts the element's
     *  animation.
     *  @param ref Path of element to cue, e.g. `/storage/shows/showID/elements/ident`
     *  @returns Resolves if a take has been scheduled. Note that this is not when
     *           the element starts animating.
     */
    take(ref: string): Promise<CommandResult>;
    /**
     *  Take an element off air.
     *  @param ref Path of an element to take out.
     *  @returns Resolves if an out has been scheduled. Note that this is not either when
     *           the element has been taken out or has started its final animation.
     */
    out(ref: string): Promise<CommandResult>;
    /**
     *  For a graphical element with multiple continue states, start the animation
     *  to the next state.
     *  Warning: do not do this out-of-sequence as it can have side effects.
     *  @param ref Path of an element to continue the state of.
     *  @returns Resolves if a continue has been scheduled.
     */
    continue(ref: string): Promise<CommandResult>;
    /**
     *  For a graphical element with multiple continue states, rewind the animation
     *  to the previous state.
     *  @param ref Path of an element to reverse continue.
     *  @returns Resolves if a continue reverse has been scheduled.
     */
    continueReverse(ref: string): Promise<CommandResult>;
    /**
     *  Initialize the playlist with the given identifier.
     *  Activating a playlist causes any associated exterrnal elements to be built
     *  and maintained within the MSE.
     *  @param playlistID Identifier of the playlist to initialize and activate. Normally,
     *                    this is a UUID value not enclosed in curly braces.
     *  @returns Resolves if the playlist initialization and activation has been
     *           scheduled. Note that this is not when the playlist becomes active.
     */
    initializePlaylist(playlistID: string): Promise<CommandResult>;
    /**
     *  Cleanup the playlist with the given identifier.
     *  Deactivating a playlist will stop the active maintenance of its referenced
     *  elements by the MSE.
     *  @param playlistID Identifier of the playlist to cleanup and deactivate. Normally,
     *                    this is a UUID value not enclosed in curly braces.
     *  @returns Resolves if the playlist cleanup and deactivation has been
     *           scheduled. Note that this is not when the playlist is no longer active.
     */
    cleanupPlaylist(playlistID: string): Promise<CommandResult>;
    /**
     *  Clean up the elements associated with a show and its profile. This will
     *  also reset the associated renderers (VizEngines).
     *  @param showID Identifier for a show.  Normally,
     *                this is a UUID value not enclosed in curly braces.
     *  @returns Resolves if the show cleanup and deactivation has been
     *           scheduled. Note that this is not when the show is no longer active.
     */
    cleanupShow(showID: string): Promise<CommandResult>;
    /**
     *  Initialize a single element. Not supported in the MSE used for development.
     *  @param ref Path of an element to initialize.
     *  @returns Rejects as not implemented.
     */
    initialize(ref: string): Promise<CommandResult>;
    /**
     *  Test the connection to the MSE's HTTP API.
     *  @returns Resolves on successful communication.
     */
    ping(): Promise<CommandResult>;
    /**
     *  Set the timeout before an HTTP request will fail.
     *  @param t Timeout measured in milliseconds.
     *  @returns The actual timeout value.
     */
    setHTTPTimeout(t: number): number;
}
export declare function createHTTPContext(profile: string, host: string, port?: number): HttpMSEClient;
