import { EventEmitter } from 'events'

const orgSetTimeout = setTimeout

const instances: Array<WebSocket> = []
let mockConstructor: (url: string, ws: WebSocket) => void

class WebSocket extends EventEmitter {
	public CONNECTING = 1
	public OPEN = 2
	public CLOSING = 3
	public CLOSED = 4

	public binaryType = ''
	public readonly connectURL: string

	private _mockConnected = true
	private _emittedConnected = false
	private _hasEmittedConnected = false
	private _failConnectEmitTimeout = 3000
	private _replyFunction?: (msg: string) => Promise<string | string[]> | string | string[]

	private _readyState: number = this.CLOSED

	public onerror: ((err: any) => void) | undefined = undefined
	public onopen: (() => void) | undefined = undefined
	public onclose: (() => void) | undefined = undefined
	public onmessage: ((msg: any) => void) | undefined = undefined

	public setTimeout = orgSetTimeout
	public mockInstanceId: number
	static mockInstanceId = 0

	constructor(connectURL: string) {
		super()
		this.connectURL = connectURL

		this.mockInstanceId = WebSocket.mockInstanceId++
		instances.push(this)

		if (mockConstructor) {
			mockConstructor(this.connectURL, this)
		}

		this._readyState = this.CONNECTING

		orgSetTimeout(() => {
			if (!this._updateConnectionStatus()) {
				setTimeout(() => {
					const error = new Error('Unable to Connect')
					if (typeof this.onerror === 'function') this.onerror(error)
					this.emit('error', error)
				}, this._failConnectEmitTimeout)
			}
		}, 1)

		// this.emit('open')
		// this.emit('message', message)
		// this.emit('error', error)
		// this.emit('close')
	}
	public static getMockInstances(): WebSocket[] {
		return instances
	}
	public static clearMockInstances(): void {
		instances.splice(0, 9999)
	}
	public static mockConstructor(fcn: (url: string, ws: WebSocket) => void): void {
		mockConstructor = fcn
	}
	public send(message: string | any, callback?: (err?: Error) => void): void {
		if (this._readyState !== this.OPEN) {
			if (typeof callback === 'function') callback(new Error('Error, not connected'))
		} else {
			if (this._replyFunction) {
				if (typeof callback === 'function') callback()

				Promise.resolve(this._replyFunction(message))
					.then(async (replies) => {
						for (const reply of Array.isArray(replies) ? replies : [replies]) {
							if (reply) {
								if (typeof this.onmessage === 'function') this.onmessage(reply)
								this.emit('message', reply)

								await sleep(1)
							}
						}
					})
					.catch((err) => {
						console.error(err)
						if (typeof this.onerror === 'function') this.onerror(err)
						this.emit('error', err)
					})
			} else {
				throw new Error('mock ws._replyFunction not set')
			}
		}
	}
	public get readyState(): number {
		return this._readyState
	}
	public mockReplyFunction(fcn: (msg: string) => Promise<string | string[]> | string | string[]): void {
		this._replyFunction = fcn
	}
	public mockSetConnected(connected: boolean): void {
		this._mockConnected = connected

		orgSetTimeout(() => {
			this._updateConnectionStatus()
		}, 1)
	}
	public mockSendMessage(message: string | any): void {
		if (typeof message !== 'string') message = JSON.stringify(message)
		this.emit('message', message)
	}
	public close(): void {
		this._readyState = this.CLOSING

		orgSetTimeout(() => {
			this.mockSetConnected(false)
		}, 1)
	}
	private _updateConnectionStatus(): boolean {
		if (this._mockConnected !== this._emittedConnected || !this._hasEmittedConnected) {
			this._emittedConnected = this._mockConnected
			this._hasEmittedConnected = true

			if (this._mockConnected) {
				this._readyState = this.OPEN
				if (typeof this.onopen === 'function') this.onopen()
				this.emit('open')
			} else {
				this._readyState = this.CLOSED
				if (typeof this.onclose === 'function') this.onclose()
				this.emit('close')
			}
		}
		return this._mockConnected
	}
}
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => orgSetTimeout(resolve, ms))
}
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace WebSocket {} // eslint-disable-lint
export = WebSocket
