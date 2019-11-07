"use strict";
/**
 *  Utility functions for transforming AtomPub XML to Javascript objects.
 *
 *  Relevant specifications include [RFC5023](https://tools.ietf.org/html/rfc5023)
 *  and [RFC4287](https://tools.ietf.org/html/rfc4287).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Xml2JS = require("xml2js");
/**
 *  Transform a direct-from-XML format [[AtomEntry|atom pub entry]] into its flatter,
 *  easier to process form.
 *  @param x Source atom pub entry.
 *  @return Simplified version of `x`.
 */
async function flattenEntry(x) {
    let keys = Object.keys(x);
    if (keys.length === 1 && (x.entry || x.ref)) {
        return flattenEntry((x.entry ? x.entry : x.ref));
    }
    let y = {};
    if (x.$) {
        for (let a in x.$) {
            y[a] = x.$[a];
        }
    }
    if (x._) {
        y.value = x._;
    }
    // MSE uses entries with nested sub-entries. Not Atom-compliant, but fairly consistent
    if (x.entry && Array.isArray(x.entry)) {
        for (let e of x.entry) {
            if (typeof e === 'object') {
                if (e.$.name === 'model_xml') {
                    try {
                        y[e.$.name] = e._ ? await Xml2JS.parseStringPromise(e._) : '';
                    }
                    catch (err) {
                        y[e.$.name] = e._;
                    }
                }
                else {
                    y[e.$.name] = await flattenEntry(e);
                }
                delete y[e.$.name].name;
            }
            else {
                if (!y.value) {
                    y = { value: [] };
                }
                y.value.push(e);
            }
        }
    }
    // Apart from when a _special_ XML element name is used. This code picks up those with different _keys_.
    for (let k of keys.filter(z => z !== 'entry' && z !== '$' && z !== '_')) {
        if (typeof x[k] === 'object') {
            if (Array.isArray(x[k])) {
                await Promise.all(x[k].map(async (z) => {
                    if (typeof z === 'object') {
                        if (z.$ && z.$.name) {
                            y[z.$.name] = await flattenEntry(z);
                            y[z.$.name].key = k;
                            delete y[z.$.name].name;
                        }
                        else {
                            if (!y[k]) {
                                y[k] = [];
                                y[`${k}_key`] = k;
                            }
                            y[k].push(await flattenEntry(z));
                        }
                    }
                    if (typeof z === 'string') {
                        y[k] = { value: z, key: k };
                    }
                }));
            }
            else {
                let e = x[k];
                if (e.$ && e.$.name) {
                    y[e.$.name] = await flattenEntry(e);
                    y[e.$.name].key = k;
                    delete y[e.$.name].name;
                }
                else {
                    y[k] = await flattenEntry(e);
                }
            }
        }
    }
    return y;
}
exports.flattenEntry = flattenEntry;
/**
 *  Tranform a simplified version of an [[AtomEntry|atom pub entry]] into its
 *  ready-to-be-build form.
 *  Note that the implementation of this is not complete. For expediancy, XML
 *  strings are build manually when required within the code.
 *  @params x Source simplified object.
 *  @return Ready for XML building version of `x`.
 */
function entry2XML(x) {
    if (Object.keys(x).length === 0)
        return { $: {} };
    let y = { $: {}, entry: [] };
    for (let a in x) {
        // console.log(a, typeof(x[a]), x[a])
        if (typeof x[a] === 'object') {
            let e = entry2XML(x[a]);
            // console.log('EEE >>>', a, x[a], e)
            e.$.name = a;
            if (e.entry && e.$.value && Array.isArray(e.entry) && e.entry.length === 0) {
                e._ = e.$.value;
                delete e.$.value;
                delete e.entry;
            }
            else if (e.entry && Array.isArray(e.entry) && e.entry[0] &&
                e.entry[0].$) {
                let counter = 0;
                let ed = [];
                while ((typeof e.entry[0].$[counter.toString()]) === 'string') {
                    ed.push(e.entry[0].$[counter.toString()]);
                    counter++;
                }
                if (ed.length > 0) {
                    e.entry = ed;
                }
            }
            y.entry.push(e);
        }
        else {
            y.$[a] = x[a];
        }
    }
    return y;
}
exports.entry2XML = entry2XML;
/**
 *  Build a Javascript representation of an [[AtomEntry|atom pub entry]] into
 *  and serialize it as a string.
 *  @param x Atom pub entry to build.
 *  @return Seialized XML representation of `x`.
 */
function buildXML(x) {
    let builder = new Xml2JS.Builder({ headless: true });
    return builder.buildObject({ entry: x });
}
exports.buildXML = buildXML;
//# sourceMappingURL=xml.js.map