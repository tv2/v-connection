import { MSE, VRundown, VizEngine, VProfile, VShow, VPlaylist } from './v-connection'
import { startPepTalk, PepTalkClient, PepTalkJS } from './peptalk'
import { /* createHTTPContext, HttpMSEClient, */ CommandResult, IHTTPRequestError } from './msehttp'
import { EventEmitter } from 'events'

function flattenEntry (x: any): any {
	let y: { [a: string]: any } = {}
	if (x.$) {
		for (let a in x.$) {
			y[a] = x.$[a]
		}
	}
	if (x.entry && Array.isArray(x.entry)) {
		for (let e of x.entry) {
			y[e.$.name] = flattenEntry(e)
			delete y[e.$.name].name
		}
	}
	return y
}

class MSERep extends EventEmitter implements MSE {
	readonly hostname: string
	readonly restPort: number
	readonly wsPort: number

	private pep: PepTalkClient & PepTalkJS

	constructor (hostname: string, restPort?: number, wsPort?: number) {
		super()
		this.hostname = hostname
		this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580
		this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595
		this.pep = startPepTalk(this.hostname, this.wsPort)
		this.pep.connect()
	}

	getRundowns (): VRundown[] { return [] }

	async getEngines (): Promise<VizEngine[]> {
		let handlers = await this.pep.getJS('/scheduler')
		console.dir((handlers.js as any).scheduler.handler
			.filter((x: any) => x.$.type === 'viz')
			.map(flattenEntry), { depth: 10 })
		return Promise.resolve([])
	}

	listProfiles (): Promise<string[]> {
		return Promise.resolve([])
	}

	getProfile (_profileName: string): Promise<VProfile> { return Promise.resolve({} as VProfile) }

	listShows (): Promise<string[]> { return Promise.resolve([]) }

	getShow (_showName: string): Promise<VShow> { return Promise.resolve({} as VShow) }

	listPlaylists (): Promise<string[]> { return Promise.resolve([]) }

	getPlaylist (_playlistName: string): Promise<VPlaylist> { return Promise.resolve({} as VPlaylist) }

	createRundown (_showID: string, _profile: string, _playlistID?: string): Promise<VRundown> {
		return Promise.resolve({} as VRundown)
	}

	deleteRundown (_showID: string, _profile: string): boolean { return false }

	createProfile (_profileName: string, _profileDetailsTbc: any): Promise<VProfile> {
		return Promise.resolve({} as VProfile)
	}

	deleteProfile (_profileName: string): Promise<boolean> { return Promise.resolve(false) }

	async ping (): Promise<CommandResult> {
		try {
			let res = await this.pep.ping()
			return { path: 'ping', status: 200, response: res.body }
		} catch (err) {
			err.path = 'ping'
			err.status = 418
			err.response = err.message
			throw err as IHTTPRequestError
		}
	}

	async close (): Promise<boolean> {
		await this.pep.close()
		return true
	}
}

export function createMSE (hostname: string, restPort?: number, wsPort?: number): MSE {
	return new MSERep(hostname, restPort, wsPort)
}

async function run () {
	let mse = createMSE('mse_ws.ngrok.io', 80, 80)
	console.log(await mse.getEngines())
	mse.close()
}

run().catch(console.error)
