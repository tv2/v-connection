"use strict";
/**
 *  Module of utilities enabling communication with the HTTP interface
 *  of a Media Sequencer Engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise-native");
class HTTPClientError extends Error {
    constructor(response, path, body) {
        super(`HTTP client error for '${path}': ${response.statusCode} - ${response.statusMessage}.`);
        this.path = path;
        this.body = body;
        this.status = response.statusCode;
        this.response = response.statusMessage;
    }
}
class HTTPServerError extends Error {
    constructor(response, path, body) {
        super(`HTTP server error for '${path}': ${response.statusCode} - ${response.statusMessage}.`);
        this.path = path;
        this.body = body;
        this.status = response.statusCode;
        this.response = response.statusMessage;
    }
}
class HTTPRequestError extends Error {
    constructor(message, path, body) {
        super(`HTTP request error for '${path}': ${message}.`);
        this.path = path;
        this.body = body;
        this.status = 418;
        this.response = message;
    }
}
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
                return new HTTPRequestError(err.message, path, body);
            }
            else {
                throw err;
            }
        }
        let response = err.response;
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
                let response = await request.post({
                    method: 'POST',
                    uri: `${this.baseURL}/${path}`,
                    body,
                    timeout: this.timeout
                });
                return { status: 200, response: response.toString() };
            }
            else {
                let response = await request.post({
                    method: 'POST',
                    uri: path,
                    body,
                    timeout: this.timeout
                });
                return { status: 200, response: response.toString() };
            }
        }
        catch (err) {
            throw this.processError(err, path.toString(), body);
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
        return this.command('continue-reverse', ref);
    }
    async ping() {
        try {
            await request({
                method: 'GET',
                uri: this.baseURL,
                timeout: this.timeout
            });
            return { status: 200, response: 'PONG!' };
        }
        catch (err) {
            throw this.processError(err, 'ping');
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