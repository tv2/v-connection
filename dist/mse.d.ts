/// <reference types="node" />
import { MSE, VRundown, VizEngine, VProfile, VShow, VPlaylist } from './v-connection';
import { PepTalkClient, PepTalkJS } from './peptalk';
import { CommandResult } from './msehttp';
import { EventEmitter } from 'events';
export declare class MSERep extends EventEmitter implements MSE {
    readonly hostname: string;
    readonly resthost?: string;
    readonly restPort: number;
    readonly wsPort: number;
    private pep;
    private connection?;
    private isAwaitingConnection;
    constructor(hostname: string, restPort?: number, wsPort?: number, resthost?: string);
    checkConnection(): Promise<void>;
    getPep(): PepTalkClient & PepTalkJS;
    getRundowns(): Promise<VRundown[]>;
    getRundown(playlistID: string): Promise<VRundown>;
    getEngines(): Promise<VizEngine[]>;
    listProfiles(): Promise<string[]>;
    getProfile(profileName: string): Promise<VProfile>;
    listShows(): Promise<string[]>;
    getShow(showName: string): Promise<VShow>;
    listPlaylists(): Promise<string[]>;
    getPlaylist(playlistName: string): Promise<VPlaylist>;
    createRundown(showID: string, profileName: string, playlistID?: string, description?: string): Promise<VRundown>;
    deleteRundown(rundown: VRundown): Promise<boolean>;
    createProfile(_profileName: string, _profileDetailsTbc: any): Promise<VProfile>;
    deleteProfile(_profileName: string): Promise<boolean>;
    ping(): Promise<CommandResult>;
    close(): Promise<boolean>;
    private timeoutMS;
    timeout(t?: number): number;
}
/**
 *  Factory to create an [[MSE]] instance to manage commumication between a Node
 *  application and a Viz Media Sequencer Engine.
 *  @param hostname Hostname or IP address for the instance of the MSE to control.
 *  @param restPort Optional port number for HTTP traffic, is different from the
 *                  default of 8580.
 *  @param wsPort   Optional port number for PepTalk traffic over websockets, if
 *                  different from the default of 8695.
 *  @param resthost Optional different host name for rest connection - for testing
 *                  purposes only.
 *  @return New MSE that will start to initialize a connection based on the parameters.
 */
export declare function createMSE(hostname: string, restPort?: number, wsPort?: number, resthost?: string): MSE;
