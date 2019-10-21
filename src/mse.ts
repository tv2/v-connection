import { MSE, VRundown, VizEngine, VProfile, VShow, VPlaylist } from './v-connection'
import { startPepTalk, PepTalkClient, PepTalkJS, PepResponse } from './peptalk'
import { /* createHTTPContext, HttpMSEClient, */ CommandResult, IHTTPRequestError } from './msehttp'
import { EventEmitter } from 'events'
import { flattenEntry, AtomEntry } from './xml'

const uuidRe = /[a-fA-f0-9]{8}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{4}-[a-fA-f0-9]{12}/

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
		let vizEntries: AtomEntry[] = (handlers.js as any).scheduler.handler
			.filter((x: any) => x.$.type === 'viz')
		let viz = await Promise.all(vizEntries.map(x => flattenEntry(x)))
		return viz as VizEngine[]
	}

	async listProfiles (): Promise<string[]> {
		await this.checkConnection()
		let profileList = await this.pep.getJS('/config/profiles', 1)
		let flatList = await flattenEntry(profileList.js as AtomEntry)
		return Object.keys(flatList).filter((x: string) => x !== 'name')
	}

	async getProfile (profileName: string): Promise<VProfile> {
		await this.checkConnection()
		let profile = await this.pep.getJS(`/config/profiles/${profileName}`)
		let flatProfile = await flattenEntry(profile.js as AtomEntry)
		return flatProfile as VProfile
	}

	async listShows (): Promise<string[]> {
		await this.checkConnection()
		let showList = await this.pep.getJS('/storage/shows', 1)
		let flatList = await flattenEntry(showList.js as AtomEntry)
		return Object.keys(flatList).filter((x: string) => x !== 'name')
	}

	async getShow (showName: string): Promise<VShow> {
		if (!showName.startsWith('{')) { showName = '{' + showName }
		if (!showName.endsWith('}')) { showName = showName + '}' }
		if (!showName.match(uuidRe)) {
			return Promise.reject(new Error(`Show name must be a UUID and '${showName}' is not.`))
		}
		await this.checkConnection()
		let show = await this.pep.getJS(`/storage/shows/${showName}`)
		let flatShow = await flattenEntry(show.js as AtomEntry)
		return flatShow as VShow
	}

	async listPlaylists (): Promise<string[]> {
		await this.checkConnection()
		let playlistList = await this.pep.getJS('/storage/playlists', 1)
		let atomEntry: any = playlistList.js as AtomEntry
		// Horrible hack ... playlists not following atom pub model
	 	if (atomEntry.entry) {
			atomEntry.entry.entry = atomEntry.entry.playlist
			delete atomEntry.entry.playlist
		}
		let flatList = await flattenEntry(playlistList.js as AtomEntry)
		return Object.keys(flatList).filter((x: string) => x !== 'name')
	}

	async getPlaylist (playlistName: string): Promise<VPlaylist> {
		if (!playlistName.startsWith('{')) { playlistName = '{' + playlistName }
		if (!playlistName.endsWith('}')) { playlistName = playlistName + '}' }
		if (!playlistName.match(uuidRe)) {
			return Promise.reject(new Error(`Playlist name must be a UUID and '${playlistName}' is not.`))
		}
		await this.checkConnection()
		let playlist = await this.pep.getJS(`/storage/playlists/${playlistName}`)
		let flatPlayliat = await flattenEntry(playlist.js as AtomEntry)
		return flatPlayliat as VPlaylist
	}

	// Rundown basics task
	createRundown (_showID: string, _profileName: string, _playlistID?: string): Promise<VRundown> {
		return Promise.resolve({} as VRundown)
	}

	// Rundown basics task
	deleteRundown (_showID: string, _profileName: string): boolean { return false }

	// Advanced feature
	createProfile (_profileName: string, _profileDetailsTbc: any): Promise<VProfile> {
		return Promise.reject(new Error('Not implemented. Creating profiles is a future feature.'))
	}

	// Advanced feature
	deleteProfile (_profileName: string): Promise<boolean> {
		return Promise.reject(new Error('Not implemented. Deleting profiles ia a future feature.'))
	}

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

	private timeoutMS: number = 3000
	timeout (t?: number): number {
		if (typeof t !== 'number') return this.timeoutMS
		return this.pep.setTimeout(t)
	}
}

export function createMSE (hostname: string, restPort?: number, wsPort?: number): MSE {
	return new MSERep(hostname, restPort, wsPort)
}

async function run () {
	let mse = createMSE('mse_ws.ngrok.io', 80, 80)
	mse.timeout(10000)
	console.dir(await mse.getShow('5A58448C-3CBE-4146-B3DF-EFC918D16266'), { depth: 20 })
	// console.log('Pre close')
	await mse.close()
	// console.log('After close.')
}

run().catch(console.error)
