# Vizrt MSE system architecture blog

This is a kind of rolling blog noting technical aspects of the [Vizrt Media Sequencer Engine](https://documentation.vizrt.com/viz-engine-guide/3.5/general_requirements_media_sequencer.html) architecture from the perspective of a developer experiencing this technology stack for the first time. The content here is exploratory, probably inaccurate in some aspects and provided at the start of a journey. At some point it will stop being updated as this library matures through design, development and testing.

## Basics

### Media Sequencer Engine

The root of documentation for the MSE is available at:

    http://mse-host.address.or.ip:8580/

MSE is used as a central software component for coordinating the execution of media elements, controlled from Vizrt products including Trio, Pilot and Mosart. Elements are defined in a VDOM tree to a schedule and executed by a sequencer.

The detailed manual for the MSE is available at any running instance from:

    http://mse-host.address.or.ip:8580/mse_manual.html

A concern in terms of integration with another automation systems with its own scheduler and state management is that the MSE is also its own scheduler and holds state. Care will have to be taken to ensure that a shared view of _current state_ is maintained across software components with similar purposes, e.g. to avoid race conditions. An automation systems needs to be aware that it is not the only client application that might be working the VDOM tree.

#### Actors

#### Filters

### Virtual Document Object Model

See the [terminology page](./terminology.md) for more information.

### Viz Data Format (VDF)

A (future?) project to provide a standard way to handle the editing of data elements. Basically, a _VDF payload document_ is data in the form of a set of name/value _fields_ where the expected fields are defined by a _VDF model document_.

No evidence of this format has been found in examples so far. 

### Four layer model

Part of the REST API documentation only,


## Protocols

### REST API

The REST API provides a way read and manipulate the VDOM tree and execute commands. It is based on the XML-namespace-heavy [Atom Syndication Format (RFC4287 - 2005)](https://tools.ietf.org/html/rfc4287) and [Atom Publishing Protocol (_AtomPub_, RFC5023 - 2007)](https://tools.ietf.org/html/rfc5023) specifications, a pre-Twitter / Facebook way to publish and edit information feeds - with equivalent functionality to [RSS](https://en.wikipedia.org/wiki/RSS). As such, to anyone who has worked with JSON / REST and APIs like those used to work with cloud services, this approach is complex. It is also difficult to relate examples in the documentation to useful activity in a workflow.

The documentation for the MSE REST API is available at:

    http://mse-host.address.or.ip:8580/doc/

Analysis of traffic between the MSE and Mosart or Trio did not show any use of the REST API. In terms of a system _eating its own dog food_, it is not clear that this is interface is a preferred way to inspect and modify the VDOM tree. However, it does seem to provide a reasonable mechanism to execute commands.

### TreeTalk

### PepTalk

### STOMP

### Ports

| Port | Description                           |
| ---- | ------------------------------------- |
| 8580 | REST API, documentation and web apps. |
| 8581 | STOMP                                 |
| 8582 | Channel state websocket               |
| 8594 | TreeTalk and PepTalk sockets          |
| 8595 | TreeTalk and PepTalk websockets       |
| 8596 | Stacktrace server port                |
