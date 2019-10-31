import { VRundown, VTemplate, InternalElement, ExternalElement, VElement } from './v-connection';
import { CommandResult } from './msehttp';
import { PepResponse } from './peptalk';
import { MSERep } from './mse';
export declare class Rundown implements VRundown {
    readonly show: string;
    readonly playlist: string;
    readonly profile: string;
    readonly description: string;
    private readonly mse;
    private readonly pep;
    private msehttp;
    constructor(mseRep: MSERep, show: string, profile: string, playlist: string, description: string);
    listTemplates(): Promise<string[]>;
    getTemplate(templateName: string): Promise<VTemplate>;
    createElement(templateName: string, elementName: string, textFields: string[], channel?: string): Promise<InternalElement>;
    createElement(vcpid: number, channel?: string, alias?: string): Promise<ExternalElement>;
    listElements(): Promise<Array<string | number>>;
    deactivate(): Promise<CommandResult>;
    deleteElement(elementName: string | number): Promise<PepResponse>;
    cue(elementName: string | number): Promise<CommandResult>;
    take(elementName: string | number): Promise<CommandResult>;
    continue(elementName: string | number): Promise<CommandResult>;
    continueReverse(elementName: string | number): Promise<CommandResult>;
    out(elementName: string | number): Promise<CommandResult>;
    activate(): Promise<CommandResult>;
    purge(): Promise<PepResponse>;
    getElement(elementName: string | number): Promise<VElement>;
}
