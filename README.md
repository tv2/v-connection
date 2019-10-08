# Sofie TV Automation Media Sequencer Engine connection library

Library to enable the Sofie TV Automation system to control a Vizrt [Media Sequencer Engine (MSE)](https://documentation.vizrt.com/viz-engine-guide/3.5/general_requirements_media_sequencer.html), to be implemented in [Node.js](https://nodejs.org/en/) with [Typescript](http://www.typescriptlang.org/).

This library is currently experimental. It currently contains:

* [_blog_ about what has been discovered so far](./doc/architecture_notes.md);
* [terminology related to the VDOM tree](./doc/VDOM_terminology.md);
* [simple prototype application that has been used to control a Viz Engine via MSE](./src/scratch/cli_bund.js);
* [draft typescript interface](./src/v-connection.ts).


## Abstract
This library bridges the Vizrt Media Sequencer Engine and typescript to all the [Sofie TV Automation system](https://github.com/nrkno/Sofie-TV-automation) to control graphics generation.

## Supported devices

* [Vizrt Media Sequencer Engine](https://documentation.vizrt.com/viz-engine-guide/3.5/general_requirements_media_sequencer.html) to control [Viz Engine](https://www.vizrt.com/products/viz-engine).

### Prerequisites

* This addon has been developed with Node.js v8.1.15 LTS.
* Install the [yarn package manager](https://yarnpkg.com/en/docs/install).

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

    import { VConnect } from 'v-connection'
    const { VConnect } = require('tv-automation-quantel-gateway')

Further instructions to follow.

## Disclaimer

This library is in no way associated with, or endorsed by, [Vizrt](https://www.vizrt.com/).
