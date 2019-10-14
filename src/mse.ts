import { MSE, VRundown, VizEngine, VProfile, VShow, VPlaylist } from './v-connection'
import { startPepTalk, PepTalkClient } from './peptalk'
import { createHTTPContext, HttpMSEClient } from './msehttp'
import { EventEmitter } from 'events'

class MSERep extends EventEmitter implements MSE {
	readonly hostname: string
	readonly restPort: number
	readonly wsPort: number

	private pep: PepTalkClient
	private rest: HttpMSEClient

	constructor (hostname: string, restPort?: number, wsPort?: number) {
		super()
		this.hostname = hostname
		this.restPort = typeof restPort === 'number' && restPort > 0 ? restPort : 8580
		this.wsPort = typeof wsPort === 'number' && wsPort > 0 ? wsPort : 8595
	}

	getRundowns (): VRundown[] { return [] }

	getEngines (): Promise<VizEngine[]> { return Promise.resolve([]) }

	listProfiles (): Promise<string[]> { return Promise.resolve([]) }

	getProfile (_profileName: string): Promise<VProfile> { return Promise.resolve({} as VProfile) }

	listShows (): Promise<string[]> { return Promise.resolve([]) }

	getShow (_showName: string): Promise<VShow> { return Promise.resolve({} as VShow) }

	listPlaylists (): Promise<string[]> { return Promise.resolve([]) }

	getPlaylist (_playlistName: string): Promise<VPlaylist> { return Promise.resolve({} as VPlaylist) }
}

export function createMSE (hostname: string, restPort?: number, wsPort?: number): MSE {
	return new MSERep(hostname, restPort, wsPort)
}
