/**
 *  Utility functions for transforming AtomPub XML to Javascript objects.
 *
 *  Relevant specifications include [RFC5023](https://tools.ietf.org/html/rfc5023)
 *  and [RFC4287](https://tools.ietf.org/html/rfc4287).
 */
/**
 *  Representation of an AtomPub entry as parsed from the Xml2JS parser and can
 *  be built by the Xml2JS builder.
 */
export interface AtomEntry {
    /** Attributes of the entry, including its required `name`. */
    '$': {
        [z: string]: string;
    };
    /** Content data of the atom entry (`CDATA`). */
    '_'?: string;
    /** Sub-entry or entries of the atom pub object. */
    entry?: AtomEntry | Array<AtomEntry> | string[];
    [z: string]: any;
}
/**
 *  A simplified, flattenned representation of an AtomPub value as an easy-to-handle
 *  Javascript object.
 */
export interface FlatEntry {
    [z: string]: string | FlatEntry | undefined;
}
/**
 *  Transform a direct-from-XML format [[AtomEntry|atom pub entry]] into its flatter,
 *  easier to process form.
 *  @param x Source atom pub entry.
 *  @return Simplified version of `x`.
 */
export declare function flattenEntry(x: AtomEntry): Promise<FlatEntry>;
/**
 *  Tranform a simplified version of an [[AtomEntry|atom pub entry]] into its
 *  ready-to-be-build form.
 *  Note that the implementation of this is not complete. For expediancy, XML
 *  strings are build manually when required within the code.
 *  @params x Source simplified object.
 *  @return Ready for XML building version of `x`.
 */
export declare function entry2XML(x: FlatEntry): AtomEntry;
/**
 *  Build a Javascript representation of an [[AtomEntry|atom pub entry]] into
 *  and serialize it as a string.
 *  @param x Atom pub entry to build.
 *  @return Seialized XML representation of `x`.
 */
export declare function buildXML(x: AtomEntry): string;
