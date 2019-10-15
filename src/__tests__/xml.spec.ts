import { flattenEntry, entry2XML, buildXML } from '../xml'
import * as Xml2JS from 'xml2js'

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

describe('Roundtrip XML', () => {

	test('Roundtrip a VizEngine entry', async () => {
		let fromXML = await Xml2JS.parseStringPromise(testXML)
		let flat = flattenEntry(fromXML.entry)
		let fat = entry2XML(flat)
		expect(buildXML(fat)).toBe(testXML)
	})
})
