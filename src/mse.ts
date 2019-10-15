import { MSE, VRundown, VizEngine, VProfile, VShow, VPlaylist } from './v-connection'
import { startPepTalk, PepTalkClient, PepTalkJS, PepResponse } from './peptalk'
import { /* createHTTPContext, HttpMSEClient, */ CommandResult, IHTTPRequestError } from './msehttp'
import { EventEmitter } from 'events'
import { flattenEntry, AtomEntry, FlatEntry } from './xml'

class MSERep extends EventEmitter implements MSE {
	readonly hostname: string
	readonly restPort: number
	readonly wsPort: number

	private pep: PepTalkClient & PepTalkJS
	private connection?: Promise<PepResponse> = undefined

	constructor (hostname: string, restPort?: number, wsPort?: number) {
		super()
		this.hostname = hostname
		this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580
		this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595
		this.pep = startPepTalk(this.hostname, this.wsPort)
		this.connection = this.pep.connect()
	}

	private async checkConnection () {
		try {
			if (this.connection) {
				await this.connection
			} else {
				this.connection = this.pep.connect()
				throw new Error('Attempt to connect to PepTalk server failed. Retrying.')
			}
		} catch (err) {
			this.connection = this.pep.connect()
			throw err
		}
	}

	getRundowns (): VRundown[] { return [] }

	async getEngines (): Promise<VizEngine[]> {
		await this.checkConnection()
		let handlers = await this.pep.getJS('/scheduler')
		let viz: FlatEntry[] = (handlers.js as any).scheduler.handler
			.filter((x: any) => x.$.type === 'viz')
			.map((x: AtomEntry) => flattenEntry(x))
		return viz as VizEngine[]
	}

	async listProfiles (): Promise<string[]> {
		await this.checkConnection()
		let profileList = await this.pep.getJS('/config/profiles', 1)
		let flatList = flattenEntry(profileList.js as AtomEntry)
		return Object.keys(flatList).filter((x: string) => x !== 'name')
	}

	async getProfile (profileName: string): Promise<VProfile> {
		await this.checkConnection()
		let profile = await this.pep.getJS(`/config/profiles/${profileName}`)
		console.dir(profile.js, { depth: 10 })
		let flatProfile = flattenEntry(profile.js as AtomEntry)
		return flatProfile as VProfile
	}

	listShows (): Promise<string[]> { return Promise.resolve([]) }

	getShow (_showName: string): Promise<VShow> { return Promise.resolve({} as VShow) }

	listPlaylists (): Promise<string[]> { return Promise.resolve([]) }

	getPlaylist (_playlistName: string): Promise<VPlaylist> { return Promise.resolve({} as VPlaylist) }

	// Rundown basics task
	createRundown (_showID: string, _profile: string, _playlistID?: string): Promise<VRundown> {
		return Promise.resolve({} as VRundown)
	}

	// Rundown basics task
	deleteRundown (_showID: string, _profile: string): boolean { return false }

	// Advanced feature
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
		if (this.connection) {
			await this.pep.close()
			return true
		}
		return false
	}
}

export function createMSE (hostname: string, restPort?: number, wsPort?: number): MSE {
	return new MSERep(hostname, restPort, wsPort)
}

async function run () {
	let mse = createMSE('mse_ws.ngrok.io', 80, 80)
	console.dir(await mse.getProfile('MOSART'), { depth: 10 })
	mse.close()
}

run().catch(console.error)
