"use strict";
/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHTTPContext = exports.HTTPRequestError = exports.HTTPServerError = exports.HTTPClientError = exports.uuidRe = void 0;
const request = require("request-promise-native");
exports.uuidRe = /[a-fA-f0-9]{8}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{12}/;
class HTTPClientError extends Error {
    constructor(response, path, body) {
        super(`HTTP client error for '${path}': ${response.statusCode} - ${response.statusMessage}.`);
        this.path = path;
        this.body = body;
        this.status = response.statusCode;
        this.response = response.statusMessage;
    }
}
exports.HTTPClientError = HTTPClientError;
class HTTPServerError extends Error {
    constructor(response, path, body) {
        super(`HTTP server error for '${path}': ${response.statusCode} - ${response.statusMessage}.`);
        this.path = path;
        this.body = body;
        this.status = response.statusCode;
        this.response = response.statusMessage;
    }
}
exports.HTTPServerError = HTTPServerError;
class HTTPRequestError extends Error {
    constructor(message, baseURL, path, body) {
        super(`HTTP request error for '${path}': ${message}.`);
        this.baseURL = baseURL;
        this.path = path;
        this.body = body;
        this.status = 418;
        this.response = message;
    }
}
exports.HTTPRequestError = HTTPRequestError;
class MSEHTTP {
    constructor(profile, host, port) {
        this.timeout = 3000;
        this.port = port ? port : 8580;
        this.host = host;
        this.profile = profile;
        this.baseURL = `http://${host}:${this.port}/profiles/${profile}`;
    }
    processError(err, path, body) {
        if (!err.response) {
            if (err.name === 'RequestError') {
                return new HTTPRequestError(err.message, this.baseURL, path, body);
            }
            else {
                throw err;
            }
        }
        const response = err.response;
        if (response.statusCode >= 400 && response.statusCode < 500) {
            return new HTTPClientError(response, path, body);
        }
        if (response.statusCode >= 500) {
            return new HTTPServerError(response, path, body);
        }
        throw err;
    }
    async command(path, body) {
        try {
            if (typeof path === 'string') {
                const response = await request({
                    method: 'POST',
                    uri: `${this.baseURL}/${path}`,
                    body,
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
                return { status: 200, response: response.toString() };
            }
            else {
                const response = await request({
                    method: 'POST',
                    url: path.toString(),
                    body,
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
                return { status: 200, response: response.toString() };
            }
        }
        catch (err) {
            throw this.processError(err, typeof path === 'string' ? `${this.baseURL}/${path}` : path.toString(), body);
        }
    }
    cue(ref) {
        return this.command('cue', ref);
    }
    take(ref) {
        return this.command('take', ref);
    }
    out(ref) {
        return this.command('out', ref);
    }
    continue(ref) {
        return this.command('continue', ref);
    }
    continueReverse(ref) {
        return this.command('continue_reverse', ref);
    }
    initializePlaylist(playlistID) {
        return this.command('initialize', `/storage/playlists/{${playlistID}}`);
    }
    initializeShow(showID) {
        return this.command('initialize', `/storage/shows/{${showID}}`);
    }
    cleanupPlaylist(playlistID) {
        return this.command('cleanup', `/storage/playlists/{${playlistID}}`);
    }
    cleanupShow(showID) {
        return this.command('cleanup', `/storage/shows/{${showID}}`);
    }
    async initialize(ref) {
        // initialize a single element
        return this.command('initialize', ref);
    }
    async ping() {
        try {
            await request.get({
                method: 'GET',
                uri: this.baseURL,
                timeout: this.timeout,
            });
            return { status: 200, response: 'PONG!' };
        }
        catch (err) {
            throw this.processError(err, '');
        }
    }
    setHTTPTimeout(t) {
        if (t > 0) {
            this.timeout = t;
        }
        return this.timeout;
    }
}
function createHTTPContext(profile, host, port) {
    return new MSEHTTP(profile, host, port);
}
exports.createHTTPContext = createHTTPContext;
//# sourceMappingURL=msehttp.js.map