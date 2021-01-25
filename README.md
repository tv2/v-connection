# Sofie TV Automation Media Sequencer Engine connection library

Library to enable the Sofie TV Automation system to control a Vizrt [Media Sequencer Engine (MSE)](https://documentation.vizrt.com/viz-engine-guide/3.5/general_requirements_media_sequencer.html), to be implemented in [Node.js](https://nodejs.org/en/) with [Typescript](http://www.typescriptlang.org/).

This library is currently experimental. It currently contains:

- [_blog_ about what has been discovered so far](./doc/architecture_notes.md);
- [terminology related to the VDOM tree](./doc/VDOM_terminology.md);
- [simple prototype application that has been used to control a Viz Engine via MSE](./scratch/cli_bund.js);
- [draft typescript interface](./src/v-connection.ts).

## Abstract

This library bridges the Vizrt Media Sequencer Engine and typescript to all the [Sofie TV Automation system](https://github.com/nrkno/Sofie-TV-automation) to control graphics generation.

## Supported devices

- [Vizrt Media Sequencer Engine](https://documentation.vizrt.com/viz-engine-guide/3.5/general_requirements_media_sequencer.html) to control [Viz Engine](https://www.vizrt.com/products/viz-engine).

### Prerequisites

- This addon has been developed with Node.js v8.1.15 LTS.
- Install the [yarn package manager](https://yarnpkg.com/en/docs/install).

### Building

Having checked out this project from git, install packages and build the native extension:

    yarn install

Build the typescript interface module:

    yarn build

This package has automated tests that run with [jest](https://jestjs.io/). Test with:

    yarn test

### Importing

Add this module to your project with one of:

    npm install v-connection
    yarn add v-connection

Import into your project with one of:

    const { createMSE, MSE } = require('v-connection')
    import { createMSE, MSE } from 'v-connection'

Use factory `createMSE` to create a connection to a running MSE, e.g.:

    let mse: MSE = createMSE('hostname.domain', restPort, wsPort)

Note that `restPort` and `wsPort` are optional. If omitted, the default port numbers will be used.

## Usage

This version of the library assumes the following setup are has been done within an MSE in advance:

- _handlers_ describing connections to VizEngines have been created.
- _handlers_ for external elements, e.g. pilot database, have been created (typically named `namespace_...`).
- a _profile_ has been created to specify the relationship between channel names and engines and to represent the state of a running show.
- one or more _shows_ that contain scenes and master templates that can be used be this library to build internal element instances.

Given that setup, the steps to use the library are:

1. Create an MSE instance (see above) to manage all communications with the MSE server.
2. Discover the details of available _shows_, _Viz Engines_ and _profiles_.
3. Use the MSE to create a _rundown_, a v-connection concept that represents the linking of its own MSE playlist, a show and a profile.
4. Add all the graphical elements to be used in the rundown.
5. Activate the rundown and initialize heavy graphical elements to pre-load them.
6. Query elements to check they are loaded and send commands to take graphics in and out, or continue through their animation states.
7. During an active rundown, create new elements and initialize each one as required. Take care not to affect engine output. Repeat steps 6 & 7 as required.
8. Deactivate a rundown and then purge all associated elements and clean up the VizEngine renderers.

## Disclaimer

This library is in no way associated with, or endorsed by, [Vizrt](https://www.vizrt.com/).
