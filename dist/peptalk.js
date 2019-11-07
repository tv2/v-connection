"use strict";
/**
 *  Module of utilities enabling communication with the PepTalk websocket interface
 *  of a Media Sequencer Engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const websocket = require("ws");
const Xml2JS = require("xml2js");
/**
 *  Location of a new XML element relative to an existing element.
 */
var LocationType;
(function (LocationType) {
    /** Insert a new element as the first child of a given parent. */
    LocationType["First"] = "first";
    /** Insert a new element as the last child of a given parent. */
    LocationType["Last"] = "last";
    /** Insert a new element before the given sibling */
    LocationType["Before"] = "before";
    /** Insert a new element after the given sibling. */
    LocationType["After"] = "after";
})(LocationType = exports.LocationType || (exports.LocationType = {}));
/**
 *  PepTalk protocol capabilities, a means of checking what a PepTalk-capable
 *  server can do.
 */
var Capability;
(function (Capability) {
    Capability["peptalk"] = "peptalk";
    Capability["noevents"] = "noevents";
    Capability["uri"] = "uri";
    Capability["xmlscheduling"] = "xmlscheduling";
    Capability["xmlscheduling_feedback"] = "xmlscheduling_feedback";
    Capability["pretty"] = "pretty";
    Capability["prettycolors"] = "prettycolors";
})(Capability = exports.Capability || (exports.Capability = {}));
function isIPepError(err) {
    return err.hasOwnProperty('status');
}
exports.isIPepError = isIPepError;
class PepError extends Error {
    constructor(status, id, message, sent) {
        super(`PepTalk ${status} error for request ${id}${message ? ': ' + message : '.'}`);
        this.status = status;
        this.id = id;
        this.sent = sent;
    }
}
class InexistentError extends PepError {
    constructor(id, path, sent) {
        super('inexistent', id, `PepTalk inexistent error: Could not locate element at ${path}.`, sent);
        this.path = path;
    }
}
exports.InexistentError = InexistentError;
class InvalidError extends PepError {
    constructor(id, description, sent) {
        super('invalid', id, `Validation error: ${description}.`, sent);
        this.description = description;
    }
}
class NotAllowedError extends PepError {
    constructor(id, reason, sent) {
        super('not_allowed', id, `Request understood put not allowed: ${reason}.`, sent);
        this.reason = reason;
    }
}
class SyntaxError extends PepError {
    constructor(id, description, sent) {
        super('syntax', id, `Syntax error in request: ${description}.`, sent);
        this.description = description;
    }
}
class UnspecifiedError extends PepError {
    constructor(id, description, sent) {
        super('unspecified', id, description, sent);
    }
}
class PepTalk extends events_1.EventEmitter {
    constructor(hostname, port) {
        super();
        this.ws = Promise.resolve(null);
        this.timeout = 3000;
        this.counter = 1;
        this.pendingRequests = {};
        this.leftovers = null;
        /** Escape a string using plaintalk representation. */
        this.esc = (s) => `{${Buffer.byteLength(s, 'utf8')}}${s}`;
        /** Remove all plaintalk escaping from a string. */
        this.unesc = (s) => s.replace(/\{\d+\}/g, '');
        this.hostname = hostname;
        this.port = port ? port : 8595;
    }
    processMessage(m) {
        let split = m.trim().split('\r\n');
        if (split.length === 0)
            return;
        let re = /\{(\d+)\}/g;
        let last = split[split.length - 1];
        let reres = re.exec(last);
        let leftovers = null;
        // console.log('SBF >>>', split)
        while (reres !== null) {
            let lastBytes = Buffer.byteLength(last, 'utf8');
            if (lastBytes - (reres.index + reres[0].length + (+reres[1])) < 0) {
                leftovers = {
                    previous: last,
                    remaining: +reres[1] - lastBytes + reres[0].length + reres.index
                };
                split = split.slice(0, -1);
                break;
            }
            reres = re.exec(last);
        }
        // console.log('SAF >>>', split)
        if (this.leftovers) {
            this.leftovers.previous = this.leftovers.previous + split[0];
            this.leftovers.remaining -= split[0] ? Buffer.byteLength(split[0], 'utf8') : 0;
            if (this.leftovers.remaining <= 0) {
                split[0] = this.leftovers.previous;
                this.leftovers = null;
            }
            else {
                return;
            }
        }
        if (split.length > 1) {
            for (let sm of split) {
                // console.log('smsm >>>', sm)
                if (sm.length > 0)
                    this.processMessage(sm);
            }
            return;
        }
        this.leftovers = leftovers ? leftovers : this.leftovers;
        if (split.length === 0)
            return;
        m = split[0];
        let firstSpace = m.indexOf(' ');
        if (firstSpace <= 0)
            return;
        let c = +m.slice(0, firstSpace);
        if (isNaN(c) || m.slice(firstSpace + 1).startsWith('begin')) {
            if (m.startsWith('* ') || m.slice(firstSpace + 1).startsWith('begin')) {
                this.emit('message', { id: '*', body: m, status: 'ok' });
            }
            else {
                try {
                    this.emit('error', new UnspecifiedError('*', `Unexpected message from server: '${m}'.`));
                }
                catch (err) { /* Allow emit with no listeners. */ }
            }
            return; // probably an event
        }
        let pending = this.pendingRequests[c];
        if (!pending) {
            try {
                this.emit('error', new UnspecifiedError(c, `Unmatched response for request ${c}.`));
            }
            catch (err) { /* Allow emit with no listeners. */ }
        }
        if (m.slice(firstSpace + 1).startsWith('ok')) {
            let response = {
                id: pending.id,
                sent: pending.sent,
                status: 'ok',
                body: this.unesc(m.slice(firstSpace + 4)).trim()
            };
            pending.resolve(response);
            delete this.pendingRequests[c];
            this.emit('message', response);
            if (pending.sent === 'close') {
                this.ws = Promise.resolve(null);
            }
            return;
        }
        if (m.slice(firstSpace + 1).startsWith('protocol')) {
            let response = {
                id: pending.id,
                sent: pending.sent,
                status: 'ok',
                body: this.unesc(m.slice(firstSpace + 1)).trim()
            };
            pending.resolve(response);
            delete this.pendingRequests[c];
            this.emit('message', response);
            return;
        }
        let errorIndex = m.indexOf('error');
        let error;
        if (errorIndex < 0 || errorIndex > 10) {
            error = new UnspecifiedError(c, `Error message with unexpected format: '${m}'`, pending.sent);
        }
        else {
            let endOfErrorName = m.slice(errorIndex + 6).indexOf(' ') + errorIndex + 6;
            endOfErrorName = endOfErrorName > 0 ? endOfErrorName : m.length;
            switch (m.slice(errorIndex + 6, endOfErrorName)) {
                case 'inexistent':
                    error = new InexistentError(c, m.slice(endOfErrorName + 1), pending.sent);
                    break;
                case 'invalid':
                    error = new InvalidError(c, m.slice(endOfErrorName + 1), pending.sent);
                    break;
                case 'not_allowed':
                    error = new NotAllowedError(c, m.slice(endOfErrorName + 1), pending.sent);
                    break;
                case 'syntax':
                    error = new SyntaxError(c, m.slice(endOfErrorName + 1), pending.sent);
                    break;
                case 'unspecified':
                    error = new UnspecifiedError(c, m.slice(endOfErrorName + 1), pending.sent);
                    break;
                default:
                    error = new PepError(m.slice(errorIndex + 6, endOfErrorName), c, m, pending.sent);
                    break;
            }
        }
        pending.reject(error);
        delete this.pendingRequests[c];
        try {
            this.emit('error', error);
        }
        catch (err) { /* Allow emit with no listeners. */ }
    }
    failTimer(c) {
        return new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject(new Error(`Parallel promise to send message ${c} did not resolve in time.`));
            }, this.timeout);
        });
    }
    makeLocation(location, sibling) {
        if (location === LocationType.First || location === LocationType.Last) {
            return `${location}`;
        }
        else {
            if (!sibling) {
                throw new UnspecifiedError(this.counter++, `Location '${location}' requested with no sibling path.`);
            }
            return `${location} ${this.esc(sibling)}`;
        }
    }
    connect(noevents) {
        this.ws = new Promise((resolve, reject) => {
            // console.log('<<<', `ws://${this.hostname}:${this.port}/`)
            let ws = new websocket(`ws://${this.hostname}:${this.port}/`);
            ws.once('open', () => {
                ws.on('message', this.processMessage.bind(this));
                resolve(ws);
            });
            ws.once('error', err => {
                reject(err);
            });
            ws.once('close', () => {
                this.ws = Promise.resolve(null);
            });
        });
        return this.send(noevents ? 'protocol peptalk noevents' : 'protocol peptalk');
    }
    close() {
        return this.send('close');
    }
    async ping() {
        let pingTest = await this.get('/', 0);
        if (pingTest.body.indexOf('<entry') >= 0) {
            pingTest.body = 'PONG!';
            return pingTest;
        }
        else {
            throw new UnspecifiedError(pingTest.id, 'Unexpected response to ping request.');
        }
    }
    send(message) {
        let c = this.counter++;
        return Promise.race([
            this.failTimer(c),
            new Promise((resolve, reject) => {
                this.ws.then(s => {
                    if (s === null) {
                        reject(new Error('Not connected.'));
                    }
                    else {
                        s.send(`${c} ${message}\r\n`);
                    }
                }).catch(err => {
                    reject(new UnspecifiedError('*', `Unexpected send error from websocket: ${err.message}`, message));
                });
                this.pendingRequests[c] = { resolve, reject, id: c, sent: message };
            })
        ]);
    }
    copy(sourcePath, newPath, location, sibling) {
        try {
            return this.send(`copy ${this.esc(sourcePath)} ${this.esc(newPath)} ${this.makeLocation(location, sibling)}`);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    delete(path) {
        return this.send(`delete ${this.esc(path)}`);
    }
    ensurePath(path) {
        return this.send(`ensure-path ${this.esc(path)}`);
    }
    get(path, depth) {
        // TODO consider some XML processing
        return this.send(`get ${this.esc(path)}${depth !== undefined ? ' ' + depth : ''}`);
    }
    insert(path, xml, location, sibling) {
        try {
            return this.send(`insert ${this.esc(path)} ${this.makeLocation(location, sibling)} ${this.esc(xml)}`);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    move(oldPath, newPath, location, sibling) {
        try {
            return this.send(`move ${this.esc(oldPath)} ${this.esc(newPath)} ${this.makeLocation(location, sibling)}`);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    protocol(capability) {
        if (!capability) {
            capability = [];
        }
        else if (!Array.isArray(capability)) {
            capability = [capability];
        }
        let list = capability.map(x => x.toString()).reduce((x, y) => `${x} ${y}`, '');
        return this.send(`protocol ${list}`);
    }
    reintialize() {
        return this.send('reinitialize');
    }
    replace(path, xml) {
        return this.send(`replace ${this.esc(path)} ${this.esc(xml)}`);
    }
    set(path, textOrKey, attributeValue) {
        if (attributeValue) {
            return this.send(`set attribute ${this.esc(path)} ${this.esc(textOrKey)} ${this.esc(attributeValue)}`);
        }
        else {
            return this.send(`set text ${this.esc(path)} ${this.esc(textOrKey)}`);
        }
    }
    uri(path, type, base) {
        return this.send(`uri ${this.esc(path)} ${type}${base ? ' ' + base : ''}`);
    }
    setTimeout(t) {
        if (t > 0)
            this.timeout = t;
        return this.timeout;
    }
    async getJS(path, depth) {
        let result = await this.get(path, depth);
        result.js = await Xml2JS.parseStringPromise(result.body);
        return result;
    }
}
function startPepTalk(hostname, port) {
    return new PepTalk(hostname, port);
}
exports.startPepTalk = startPepTalk;
//# sourceMappingURL=peptalk.js.map