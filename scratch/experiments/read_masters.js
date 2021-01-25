const fs = require('fs')
const xml2js = require('xml2js')
const readFile = require('util').promisify(fs.readFile)

let parser = new xml2js.Parser()

async function run() {
	let data = await readFile('scratch/experiments/master_teas.xml', 'utf8')
	let result = await parser.parseStringPromise(data)
	let templates = {}
	for (let t of result.entry.element) {
		for (let k in t.$) {
			t[k] = t.$[k]
		}
		delete t.$
		templates[t.name] = t
		for (let e of t.entry) {
			t[e.$.name] = e._ ? e._ : e
			delete e.$
		}
		delete t.entry
		if (t.model_xml) {
			let mxml = await parser.parseStringPromise(t.model_xml)
			t.model_xml = mxml
		}
	}
	console.dir(templates, { depth: 10 })
}

run()
