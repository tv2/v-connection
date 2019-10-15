"use strict";
/**
 *  Interfaces for controlling Vizrt Media Sequencer Engine from Node.js applications.
 *
 *  Intended usage pattern:
 *  1. Create an [[MSE]] instance to manage all communications with the MSE server.
 *  2. Discover the details of availale [[VShow|shows]], [[VizEngine|Viz Engines]]
 *     and [[VProfile|profiles]]. TODO create a profile?
 *  3. Use the MSE to create [[VRundown|rundowns]] that link shows to profiles.
 *  4. Add all the [[VElement|graphical elements]] used in a show.
 *  5. Activate a rundown and send commands to take graphics in and out.
 *  6. Deactivate a rundown and finally purge all associated elements and state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=v-connection.js.map