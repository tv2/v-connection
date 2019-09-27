# Media Sequence Engine Terminology

A set of definitions of terms found in the MSE _VDOM_ tree structure that fit with the way MSE will be used in the first application of this library.

### Show

    /storage/shows/{<uuid>}

As originally intended, a show would be the _daily ten o'clock news_ and contains all the templates that can be used in that show.

An alternative view show can also be used as a larger and more general collection of templates that can be used across several shows, e.g. all news shows done from a particular studio. In this approach, the collection of templates containing a superset of all possible graphical elements for every show of a certain kind, e.g. sports news from _studio 3_.

A new show may be created for a special event, such as a general election.

Shows and templates are created in MSE via _Trio_.

### Template

Shows have _elements_, _master templates_ and _scene information_, referred to as the _show templates_.

Templates are allocated to layers. Each layer has an _out_ template that clear any graphics on that layer. A special template called _All_OUT_ is used to clear all layers and it is recommended that this template is taken at the end of every story. This ensures that the Viz Engine is reset.

Note that this term does not refer to path `/storage/templates`.

### Playlist

    /storage/playlists/{<uuid>}

A specific show at a specific time has a playlist. An automation systems must build a playlist before each show. The playlist contains the elements that can be taken within the show. Complex elements (e.g. fullscreens) and elements that are stored _externally_ in the pilot database must be pre-built before the show.

### Handlers

    /scheduler/<engine_name>

Each VizEngine has a _handler_ that is a representation of state of that device. An automation systems has to create the handlers it intends to use on initialisation, including hostname.

### Profile

    /config/profiles/<profile_name>

A profile groups together all the handlers used by a playlist. Typically, an automation system creates itself a single profile within the MSE with its own name, e.g. _SOFIE_. Commands are sent via profiles.

### Elements

    /storage/shows/{<uuid>}/elements/<element_name>
		/storage/playlists/{<uuid>}/elements/<ref_id>
		/external/pilotdb/elements/<element_key>

Elements are the specification of an instance of a master template created by providing the data. For example, a lower third element (_bund_) contains a reference to the lower third master template and the _name_ and _title_ fields to be displayed.

Elements can be internal or external.

* An external element is held in a system called _pilot_ and is completely specified and managed from there, including its template. Pilot is used for large and complex graphical elements. Internal elements, used for fullscreen graphics and graphics that change. Note that in current workflows, the right arrow key is used to navigate between each part of the graphics (`continue` command).

* An internal element has its template and data stored within the MSE. These are typically used for simple overlays. It is good practice to create a separate element within a show for each instance that is to be used. This allows the elements to be initialized and taken without delay.

### Commands

    POST /config/profile/<profile_name>/<command>

Commands cause the VixEngine to take actions, including:

* `take` - Show a given graphical element, animating in. This can also be used to update the data in a graphic and, if and only if the data has changed, will run the animation again.
* `out` - Hide a graphic, causing the out animation to run.
* `update` - Update the contents of a graphic without any animation - not really used.
* `continue` - Move to the next state for the graphic. Used for complex fullscreens and controlled by pressing the right arrow key in Mosart. (Also `continue_reverse`.)
* `cut` - cut short a graphic without animating out - not used.
* `initialize`, `cue`, `prepare` - to be explored.

Initialize and clean commands are available for playlists and shows. These need further investigation.
