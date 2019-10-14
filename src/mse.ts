import { MSE, VRundown, VizEngine, VProfile, VShow, VPlaylist } from './v-connection'
import { startPepTalk, PepTalkClient } from './peptalk'
import { /* createHTTPContext, HttpMSEClient, */ CommandResult } from './msehttp'
import { EventEmitter } from 'events'

class MSERep extends EventEmitter implements MSE {
	readonly hostname: string
	readonly restPort: number
	readonly wsPort: number

	private pep: PepTalkClient

	constructor (hostname: string, restPort?: number, wsPort?: number) {
		super()
		this.hostname = hostname
		this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580
		this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595
		this.pep = startPepTalk(this.hostname, this.wsPort)
	}

	getRundowns (): VRundown[] { return [] }

	getEngines (): Promise<VizEngine[]> { return Promise.resolve([]) }

	listProfiles (): Promise<string[]> { return Promise.resolve([]) }

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
		let res = await this.pep.ping()
		return { path: 'ping', status: 200, response: 'PONG!' }
	}
}

export function createMSE (hostname: string, restPort?: number, wsPort?: number): MSE {
	return new MSERep(hostname, restPort, wsPort)
}
