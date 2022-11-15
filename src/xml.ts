/**
 *  Utility functions for transforming AtomPub XML to Javascript objects.
 *
 *  Relevant specifications include [RFC5023](https://tools.ietf.org/html/rfc5023)
 *  and [RFC4287](https://tools.ietf.org/html/rfc4287).
 */

import * as Xml2JS from 'xml2js'

/**
 *  Representation of an AtomPub entry as parsed from the Xml2JS parser and can
 *  be built by the Xml2JS builder.
 */
export interface AtomEntry {
	/** Attributes of the entry, including its required `name`. */
	$: { [z: string]: string }
	/** Content data of the atom entry (`CDATA`). */
	_?: string
	/** Sub-entry or entries of the atom pub object. */
	entry?: AtomEntry | Array<AtomEntry> | string[]
	// TODO ref type
	[z: string]: any
}

/**
 *  A simplified, flattenned representation of an AtomPub value as an easy-to-handle
 *  Javascript object.
 */
export interface FlatEntry {
	[z: string]: string | FlatEntry | undefined
}

/**
 *  Transform a direct-from-XML format [[AtomEntry|atom pub entry]] into its flatter,
 *  easier to process form.
 *  @param x Source atom pub entry.
 *  @return Simplified version of `x`.
 */
export async function flattenEntry(x: AtomEntry): Promise<FlatEntry> {
	const keys = Object.keys(x)
	if (keys.length === 1 && (x.entry || x.ref)) {
		return flattenEntry((x.entry ? x.entry : x.ref) as AtomEntry)
	}
	let y: { [a: string]: any } = {}
	if (x.$) {
		for (const a in x.$) {
			y[a] = x.$[a]
		}
	}
	if (x._) {
		y.value = x._
	}
	// MSE uses entries with nested sub-entries. Not Atom-compliant, but fairly consistent
	if (x.entry && Array.isArray(x.entry)) {
		let unnamedCount = 0
		for (const e of x.entry) {
			if (typeof e === 'object') {
				if (e.$ && e.$.name) {
					if (e.$.name === 'model_xml') {
						try {
							y[e.$.name] = e._ ? await Xml2JS.parseStringPromise(e._) : ''
						} catch (err) {
							y[e.$.name] = e._
						}
					} else {
						y[e.$.name] = await flattenEntry(e)
					}
					delete y[e.$.name].name
				} else {
					y[`_entry#${unnamedCount++}`] = await flattenEntry(e)
				}
			} else {
				if (!y.value) {
					y = { value: [] }
				}
				y.value.push(e)
			}
		}
	}
	// Apart from when a _special_ XML element name is used. This code picks up those with different _keys_.
	for (const k of keys.filter((z) => z !== 'entry' && z !== '$' && z !== '_')) {
		if (typeof x[k] === 'object') {
			if (Array.isArray(x[k])) {
				await Promise.all(
					x[k].map(async (z: any) => {
						if (typeof z === 'object') {
							if (z.$ && z.$.name) {
								y[z.$.name] = await flattenEntry(z as AtomEntry)
								y[z.$.name].key = k
								delete y[z.$.name].name
							} else {
								if (!y[k]) {
									y[k] = []
									y[`${k}_key`] = k
								}
								y[k].push(await flattenEntry(z as AtomEntry))
							}
						}
						if (typeof z === 'string') {
							y[k] = { value: z, key: k }
						}
					})
				)
			} else {
				const e = x[k]
				if (e.$ && e.$.name) {
					y[e.$.name] = await flattenEntry(e)
					y[e.$.name].key = k
					delete y[e.$.name].name
				} else {
					y[k] = await flattenEntry(e)
				}
			}
		}
	}
	return y
}

/**
 *  Tranform a simplified version of an [[AtomEntry|atom pub entry]] into its
 *  ready-to-be-build form.
 *  Note that the implementation of this is not complete. For expediancy, XML
 *  strings are build manually when required within the code.
 *  @params x Source simplified object.
 *  @return Ready for XML building version of `x`.
 */
export function entry2XML(x: FlatEntry): AtomEntry {
	if (Object.keys(x).length === 0) return { $: {} as { [z: string]: string } }
	const y = { $: {} as { [z: string]: any }, entry: [] as any[] }
	for (const a in x) {
		// console.log(a, typeof(x[a]), x[a])
		if (typeof x[a] === 'object') {
			const e = entry2XML(x[a] as FlatEntry)
			// console.log('EEE >>>', a, x[a], e)
			if (!a.startsWith('_')) {
				e.$.name = a
			}
			if (e.$.value && e.$.key) {
				delete e.$.key
			}
			if (e.entry && e.$.value && Array.isArray(e.entry) && e.entry.length === 0) {
				e._ = e.$.value
				delete e.$.value
				delete e.entry
			} else if (e.entry && Array.isArray(e.entry) && e.entry[0] && (e.entry[0] as AtomEntry).$) {
				let counter = 0
				const ed = []
				while (typeof (e.entry[0] as AtomEntry).$[counter.toString()] === 'string') {
					ed.push((e.entry[0] as AtomEntry).$[counter.toString()])
					counter++
				}
				if (ed.length > 0) {
					e.entry = ed
				}
			}
			y.entry.push(e)
		} else {
			y.$[a] = x[a]
		}
	}
	return y
}

/**
 *  Build a Javascript representation of an [[AtomEntry|atom pub entry]] into
 *  and serialize it as a string.
 *  @param x Atom pub entry to build.
 *  @return Seialized XML representation of `x`.
 */
export function buildXML(x: AtomEntry): string {
	const builder = new Xml2JS.Builder({ headless: true })
	return builder.buildObject({ entry: x })
}

/**
 *  Build a Map containing paths and their contents
 *  @param x Source atom pub entry.
 *  @return a Map where keys are paths, and values are the contents of the entries
 */
export async function toFlatMap(x: AtomEntry): Promise<Map<string, string>> {
	const result = new Map<string, string>()
	const flatEntry = await flattenEntry(x)
	toFlatMapInternal(flatEntry, result, '')
	return result
}

function toFlatMapInternal(x: FlatEntry, map: Map<string, string>, path: string) {
	for (const key in x) {
		if (key === 'name' || x[key] === undefined) continue
		if (key === 'value' && typeof x['value'] === 'string') {
			map.set(path, x['value'])
			return
		}
		if (typeof x[key] === 'object') {
			toFlatMapInternal(x[key] as FlatEntry, map, `${path}${path && '/'}${key}`)
		}
	}
}
