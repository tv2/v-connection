# Vizrt MSE system architecture blog

This is a kind of rolling blog noting technical aspects of the [Vizrt Media Sequencer Engine](https://documentation.vizrt.com/viz-engine-guide/3.5/general_requirements_media_sequencer.html) architecture. This is from the perspective of a developer experiencing this technology stack for the first time. The content here is exploratory, probably inaccurate in some aspects and provided at the start of a journey. At some point it will stop being updated as this library matures through design, development and testing.

## Basics

### Media Sequencer Engine

The root of documentation for the MSE is available at:

    http://mse-host.address.or.ip:8580/

MSE is used as a central software component for coordinating the execution of media elements, controlled from Vizrt products including Trio, Pilot and Mosart. Elements are defined in a _VDOM tree_ providing a schedule that is executed by a sequencer.

The detailed manual for the MSE is available at any running instance from:

    http://mse-host.address.or.ip:8580/mse_manual.html

A concern in terms of integration with third party automation systems that have their own scheduler and state management is that the MSE is also a scheduler that holds state. Care will have to be taken to ensure that a shared view of _current graphical state_ is maintained across software components with similar purposes, e.g. to avoid race conditions where one puts up a graphic and another takes it down, repeatedly. Asynchronously, an automation system may need to be aware that it is not the only client application that might be working MSE data structures.

#### Actors

Actors are implemented as DLL plugins to the MSE. They can read and process the contents of the MSE tree structure, interpreting what they find to take actions according to the defined schedule. An actor can also modify the tree and receive updates about third party actors, also making its own changes to the tree.

The actions of the MSE are configured by _handlers_ that are defined in the scheduler sub-tree, e.g.:

    /scheduler/http_server

This actor allows the port used to configure the REST API and other HTML resources provided by the MSE _HTTP server_ actor to be configured. Similarly for other protocols.

Each [Viz Engine](https://www.vizrt.com/products/viz-engine) controlled by the MSE has a separate handler that includes its host name or IP address.

#### Filters and iterators

Filters process parts of the VDOM tree, selecting elements of interest to another handler or converting them to text, for example to create a log message entry.

Iterators allow other handlers to walk parts of a sub-tree or specify an iterative loop.

### Virtual Document Object Model

![VDOM config example](vdom.png)

See the [terminology page](./VDOM_terminology.md) for more information.

To see and edit the VDOM tree, use the _VDOM config web app_ available at the following URL:

    http://mse-host.address.or.ip:8580/app/vdomconfig/vdomconfig.html

This connects over websockets and uses the PepTalk protocol.

### Viz Data Format (VDF)

This is the underlaying means of describing the content that an element is filled-in with. An element has a _VDF payload_.

The documentation refers to a (apparently future?) project to provide a standard way to represent the editing of data elements. Basically, a _VDF payload document_ is data in the form of a set of name/value _fields_ where the expected fields are defined by a _VDF model document_. No evidence of this format has been found in examples so far.

### Four layer element model

Part of the REST API documentation only, a four-layer model is referred to:

1. **element** - can have different _fill-in_ data, _concepts_ and _variants_
2. **element model** - describes each of the fields that are to be filled in
3. **master template** - description of all possible layers, concepts and variants for an element, with optional scene selectors
4. **scene info** - how to apply data to one particularly scene

Note that the model can be considered as having just three layers as the element model is really just part of the master template.

The details of how all these layers are applied in practice will be explored using real examples.

## Protocols

### REST API

The REST API provides a way read and manipulate the VDOM tree and execute commands. It is based on the XML-namespace-heavy [Atom Syndication Format (RFC4287 - 2005)](https://tools.ietf.org/html/rfc4287) and [Atom Publishing Protocol (_AtomPub_, RFC5023 - 2007)](https://tools.ietf.org/html/rfc5023) specifications, a pre-Twitter / Facebook way to publish and edit information feeds. Atom has equivalent functionality to [RSS](https://en.wikipedia.org/wiki/RSS). As such, to anyone who has worked with JSON / REST and APIs like those used to work with modern cloud services, this approach is complex and weird. It is also difficult to relate examples in the documentation to useful activity in a workflow. Some of the examples don't seem to work.

The documentation for the MSE REST API is available at:

    http://mse-host.address.or.ip:8580/doc/

Analysis of traffic between the MSE and Mosart or Trio did not show any use of the REST API. In terms of a system _eating its own dog food_, it is not clear that this is interface is a preferred way to inspect and modify the VDOM tree. However, it does seem to provide a reasonable mechanism to execute commands.

### TreeTalk ... and PlainTalk

Declared as _deprecated_ at the top level of the documentation, _TreeTalk_ is a way of manipulating the VDOM tree. It involves a strange mix of partial XML-like paths and pointer-like hex references to child elements and siblings within the VDOM tree. This makes it difficult to read and would require a computer program to make it useable.

TreeTalk is an MSE actor and documented in the MSE manual. It is based on a text-based line-by-line asynchronous pattern called _PlainTalk_. Each line related to a request starts with an identifier and is terminated with `\r\n`. Responses start with the matching identifier, whereas events start with an asterisk (`*`). Sequences of binary data or text data containing whitespace is proceeded by `{n}`, where `n` is the number of characters in the following field.

Wireshark shows that a few command-like messages between Mosart and MSE are still using TreeTalk. On opening a socket connection, TreeTalk is selected with the `protocol` command as the first message, e.g.:

    1 protocol treetalk

TreeTalk can be reached by telnet on port `8594` or as a websocket on port `8595`. Once a connection is made, all operations that change the VDOM tree are reported via the socket. To suppress this, add `noevents` to the protocol commands.

In experiments, data structures in the VDOM were explored using TreeTalk. This was a time consuming process with lots of taking notes to keep track of pointer references within the tree. This approach is not recommended.

### PepTalk

_PepTalk_ is a replacement for TreeTalk whereby the VDOM tree and sub-trees can be serialized and manipulated (inserted, replaced, deleted, edited) as XML fragments. Wireshark shows traffic between Trio, Mosart and the VDOM config web app is using PepTalk. This same dog food! PepTalk is also based on PlainTalk.

On opening a socket connection, PepTalk is selected with the `protocol` command as the first message, e.g.:

    1 protocol peptalk

Like TreeTalk, PepTalk can be reached by Telnet on port `8594` or as a websocket on port `8595`. Once a connection is made, all operations that change the VDOM tree are reported via the socket. To suppress this, add `noevents` to the protocol commands.

Here are some contrived examples:

- `42 set attribute /path/to/element {9}new value`
  - result on success is `42 ok`
- `43 get /path/to/element 10` (10 is the depth of the tree - optional)
  - result on success is `43` followed by XML for the element at that path
- `44 replace /path/to/element {33}<entry name="fred">ginger</entry>`
  - result on success is `44 ok`

In experiments, it was possible to query and alter the VDOM tree using PepTalk over websockets. This seems to be a good approach to editing the data within elements and other operations in the VDOM tree. It may also be a good way to spot changes being made to the tree by third party applications as these are reported as events.

### STOMP

The documentation claims that MSE supports the [Simple Text Oriented Messaging Protocol (STOMP)](https://stomp.github.io/). STOMP is a protocol for asynchronous communication with message brokers, such as [JMS](https://en.wikipedia.org/wiki/Java_Message_Service) queues, ideal for use with scripting languages. Javascript support is limited to the [stomp.js](http://jmesnil.net/stomp-websocket/doc/) STOMP-over-websockets library.

This might be an option to explore further if other approaches are unsuccessful.

### Ports

| Port | Description                           |
| ---- | ------------------------------------- |
| 8580 | REST API, documentation and web apps. |
| 8581 | STOMP                                 |
| 8582 | Channel state websocket               |
| 8594 | TreeTalk and PepTalk plain sockets    |
| 8595 | TreeTalk and PepTalk websockets       |
| 8596 | Stacktrace server port                |

## Proposed approach

### Prototyping

A simple Node.js application has been written ([`cli_bund.js`](../scratch/cli_bund.js)) that allows interaction with the an MSE to change the text of a lower third overlay, _take-in_ the graphic, wait ten seconds and _take-out_ the graphic. This will be the basis of ongoing development, using the following modules:

- [`ws`](https://www.npmjs.com/package/ws) to connect to the MSE over webscockets with PepTalk. Used for reading and writing data and monitoring events.
- [`request-promise-native`](https://www.npmjs.com/package/request-promise-native) to POST commands to the REST interface of the MSE.

So as to work with the XML structures in a Javascript-like format, the following library will be used:

- [`xml2js`](https://www.npmjs.com/package/xml2js) to convert XML to Javascript Objects and to programmatically build XML elements for sending to the MSE. Using this module, it should be difficult to generate syntactically-bad XML.

The structure of this prototype will be used as the basis of ongoing development.

### Required information

This section describes information the v-connection library is likely to need to do its job. Some information may not be required depending of the agreed workflow. Questions are shown in **_bold italic_**.

#### Configuration

As part of its configuration, the v-connection library will need some or all of the following information:

- Viz Engine host names or ip addresses and an _alias_ for making reference to their handlers. **_Does Sofie configure these handlers?_** **_Does Sofie monitor health and/or state of a Viz Engine (as well as an MSE)?_**
- A _profile_ name - Mosart used `MOSART` so Sofie should probably use `SOFIE`. **_Does Sofie create the profile?_** **_Do we set the show (`directory`) at this point?_**
- _Execution groups_ and mappings to Viz Engine aliases. Names are typically `DSK` and `FULL1` but may differ in more complex setups, e.g. large graphic walls. **_Does Sofie configure this?_**
- MSE hostname or IP address. Also, port numbers for HTTP/REST traffic (defaults to `8580`) and PepTalk over websockets (defaults to `8595`) if different from defaults.

It is assumed that the show will be loaded into MSE via another tool, such as Viz Trio. **_Is this the case?_**

#### Per rundown

##### Initialisation

Information that must be provided on the Initialisation of a rundown in a gallery prior to the first take. **_Where does this information come from upstream?_**

- Which show is in use? A UUID, e.g. `/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}`
- Create a new playlist.

* Has a UUID _name_ e.g. `{B1607743-7FD0-45D5-98EE-50C152EFB4EC}`
* Also has a _description_ e.g. `NEWS.ON-AIR-NEWS02`
* May contain a profile reference, e.g. `/config/profiles/SOFIE`

- Create a show element (overlays) or playlist element (fullscreens / complex) per graphics _piece_:
  - For pilot elements:
    - External reference, e.g. `/external/pilotdb/elements/2236983`

* For overlays (internal elements):
  - Name of the master template, e.g. _Bund_, _Topt_, _Ident_.
  - Name for the element instance, e.g. `100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_1`
  - Initial data values according the templates `model_xml` schema. For example, for a _Bund_, `{ "name": "Richard", "title": "Coder" }` **_For templates with numbers labelling fields, should we use names or numbers here?_**

Elements will need to be created and updated as the rundown changes. **_OK?_**

**_Should Sofie send any show/playlist initialisation commands?_**

Some shows require a page to be taken in then out prior to displaying elements to establish a specific style. **_How will Sofie do this?_**

##### Execution

For the playout of each graphics piece, send commands where each one includes either the show (internal) or pilot (external) references:

- `cue` the element just prior to the `take`
- `take` the element to display it
- `continue` the element to advance graphics state **_TV 2 Mosart users press the right arrow key to do this - what is the Sofie equivalent?_**
- `out` to remove the element with animation

Note that `cut` can be used to remove an element without the animation.

At the end of a segment, `take` the _ALL_OUT_ element to clear all layers.

##### Deactivation

At the end of a rundown, some tidying up is required:

- Remove all internal elements created in a show.
- Clean up the playlist. **_Is this a good idea?_**
- **_Anything else? Call the show/playlist clean command?_**

**_When should this be done? Allow time for post-rundown analysis?_**

### State

As far as possible, the v-connection library should not store any state. It should read and write from the VDOM tree as required to perform any business logic.
