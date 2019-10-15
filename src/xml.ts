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
	'$': { [z: string]: string }
	/** Content data of the atom entry (`CDATA`). */
	'_'?: string
	/** Sub-entry or entries of the atom pub object. */
	entry?: AtomEntry | Array<AtomEntry> | string[]
	// TODO ref type
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
export function flattenEntry (x: AtomEntry): FlatEntry {
	if (Object.keys(x).length === 1 && x.entry) return flattenEntry(x.entry as AtomEntry)
	let y: { [a: string]: any } = {}
	if (x.$) {
		for (let a in x.$) {
			y[a] = x.$[a]
		}
	}
	if (x._) {
		y.value = x._
	}
	if (x.entry && Array.isArray(x.entry)) {
		for (let e of x.entry) {
			if (typeof e === 'object') {
				y[e.$.name] = flattenEntry(e)
				delete y[e.$.name].name
			} else {
				if (!y.value) { y = { value: [] } }
				y.value.push(e)
 			}
		}
	}
	return y
}

/**
 *  Tranform a simplified version of an [[AtomEntry|atom pub entry]] into its
 *  ready-to-be-build form.
 *  @params x Source simplified object.
 *  @return Ready for XML building version of `x`.
 */
export function entry2XML (x: FlatEntry): AtomEntry {
	if (Object.keys(x).length === 0) return { $: {} as { [ z: string]: string } }
	let y = { $: {} as { [ z: string]: any }, entry: [] as any[] }
	for (let a in x) {
		// console.log(a, typeof(x[a]), x[a])
		if (typeof x[a] === 'object') {
			let e = entry2XML(x[a] as FlatEntry)
			// console.log('EEE >>>', a, x[a], e)
			e.$.name = a
			if (e.entry && e.$.value && Array.isArray(e.entry) && e.entry.length === 0) {
				e._ = e.$.value
				delete e.$.value
				delete e.entry
			} else if (e.entry && Array.isArray(e.entry) && e.entry[0] &&
					(e.entry[0] as AtomEntry).$) {
				let counter = 0
				let ed = []
				while (typeof (e.entry[0] as AtomEntry).$[counter.toString()] === 'string') {
					ed.push((e.entry[0] as AtomEntry).$[counter.toString()])
					counter ++
				}
				if (ed.length > 0) { e.entry = ed }
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
export function buildXML (x: AtomEntry): string {
	let builder = new Xml2JS.Builder({ headless: true })
	return builder.buildObject({ entry: x })
}

// let entryListXML = `<entry name="program">
//   <entry name="viz">
//     <entry>FULL1</entry>
// 		<entry>DSK</entry>
//   </entry>
//   <entry name="video">
//     <entry/>
//   </entry>
// </entry>`

let testXML = `<entry mode="enabled" status="uninitialized" type="viz" name="Viz A">
  <entry name="encoding">UTF-8</entry>
  <entry name="state"/>
  <entry name="renderer">
    <entry name="192.168.1.2">
      <entry name="active"/>
    </entry>
  </entry>
  <entry name="publishing_point_uri"/>
  <entry name="publishing_point_atom_id"/>
  <entry name="info"/>
</entry>`

async function run () {
	let fromXML = await Xml2JS.parseStringPromise(testXML)
	console.dir(fromXML, { depth: 10 })
	let flat = flattenEntry(fromXML.entry)
	console.dir(flat, { depth: 10 })
	let fat = entry2XML(flat)
	console.dir(fat, { depth: 10 })
}

run().catch(console.error)
