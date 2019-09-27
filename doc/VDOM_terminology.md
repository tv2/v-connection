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

A profile groups together all the handlers used by a playlist. Typically, an automation system creates itself a single profile within the MSE with its own name, e.g. _SOFIE_. 
