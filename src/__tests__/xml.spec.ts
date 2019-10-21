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

let entryListXML = `<entry name="program">
  <entry name="viz">
    <entry>FULL1</entry>
    <entry>DSK</entry>
  </entry>
  <entry name="video">
    <entry/>
  </entry>
</entry>`

describe('Roundtrip XML', () => {

	test('Roundtrip a VizEngine entry', async () => {
		let fromXML = await Xml2JS.parseStringPromise(testXML)
		let flat = flattenEntry(fromXML.entry)
		let fat = entry2XML(flat)
		expect(buildXML(fat)).toBe(testXML)
	})

	test('Roundtrip with value list', async () => {
		let fromXML = await Xml2JS.parseStringPromise(entryListXML)
		let flat = flattenEntry(fromXML.entry)
		let fat = entry2XML(flat)
		expect(buildXML(fat)).toBe(entryListXML)
	})
})

let nonEntry = `<entry name="elements">
    <element available="1.00" creator="Sofie" description="Firstname Lastname/title" guid="2019-09-27T09:06:34Z_od-triotravel03.tv2.local_6667_0" loaded="0.00" take_count="0" updated="2019-09-27T09:06:34Z" name="SUPERFLY2">
        <ref name="master_template">/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/mastertemplates/LGFX_SOCIAL_MEDIA</ref>
        <entry name="default_alternatives"/>
        <entry name="data">
            <entry name="author">Christine MacNeill</entry>
            <entry name="title">Always typing</entry>
            <entry name="contributor">IMAGE*TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/elements/logo/Twitter</entry>
            <entry name="image_url">IMAGE*TV2/SPORTEN/2015/TOUR15/Elementer/Baggrund_Tour2015_1_Background</entry>
            <entry name="thumbnail">IMAGE*TV2/PILOT_TEMPLATES/SPORT/FODBOLD/VM_2018/assets/flag/ENG</entry>
        </entry>
    </element>
    <element available="1.00" creator="Mosart" description="Firstname Lastname/title" guid="2019-09-27T09:06:34Z_od-triotravel03.tv2.local_6666_0" loaded="0.00" take_count="0" updated="2019-09-27T09:06:34Z" name="SUPERFLY">
        <ref name="master_template">/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/mastertemplates/Bund</ref>
        <entry name="default_alternatives"/>
        <entry name="data">
            <entry name="20">Christine MacNeill</entry>
            <entry name="21">Chief Food Scientist</entry>
        </entry>
    </element>
</entry>`

let tempEntry = `<entry name="mastertemplates">
    <element templatedescription="&quot;APP PROMO&quot;" name="APP_PROMO_NEWS_SPO">
        <entry name="default_alternatives"/>
        <entry name="layers">
            <ref>/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/sceneselectors/APP_PROMO_NEWS_SPO</ref>
        </entry>
        <entry name="settings">
            <entry name="tabfields">
                <entry name="APP_BUND">
                    <entry name="searchtext"/>
                </entry>
                <entry name="APP_TOP">
                    <entry name="searchtext"/>
                </entry>
                <entry name="bg_col">
                    <entry name="searchtext"/>
                </entry>
                <entry name="CLOCK_COLOR">
                    <entry name="searchtext"/>
                </entry>
                <entry name="imageApp1">
                    <entry name="searchtext"/>
                </entry>
                <entry name="imageApp2">
                    <entry name="searchtext"/>
                </entry>
                <entry name="text_col">
                    <entry name="searchtext"/>
                </entry>
            </entry>
        </entry>
        <entry name="model_xml">&lt;model xmlns=&quot;http://www.vizrt.com/types&quot;&gt;&lt;schema&gt;&lt;fielddef name=&quot;APP_TOP&quot; label=&quot;top&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/elements/colors/mobil_promo/APP_TOP_Layer_2&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;61612A54-DA9F-4C62-913BFF587D724438&amp;gt;&quot; path=&quot;object*iPhone_6*animation_in*fix_rotation*UNIFY*screen*TOP_BOTTOM*top&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;APP_BUND&quot; label=&quot;top&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/elements/colors/mobil_promo/APP_BUND_BUND_NYH&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;47108475-28AC-4A27-BA90219974F2B2CB&amp;gt;&quot; path=&quot;object*iPhone_6*animation_in*fix_rotation*UNIFY*screen*TOP_BOTTOM*buttom&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;CLOCK_COLOR&quot; label=&quot;CLOCK_COLOR&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/elements/colors/black&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;36633B00-BD9E-4DD5-A288F8ACF17690D3&amp;gt;&quot; path=&quot;object*iPhone_6*animation_in*fix_rotation*UNIFY*screen*clock&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;imageApp2&quot; label=&quot;imageApp2&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/overlay_front_layer/NyhederneApp&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;FA750F69-52A7-4413-8B12460874417C24&amp;gt;&quot; path=&quot;object*iPhone_6*animation_in*fix_rotation*UNIFY*screen*imageApp2&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;imageApp1&quot; label=&quot;imageApp1&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/overlay_front_layer/Business&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;E7288BB2-5098-4341-8058516BF6651423&amp;gt;&quot; path=&quot;object*iPhone_6*animation_in*fix_rotation*UNIFY*screen*BUSINESS_LIVE*imageApp1&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;text_1&quot; label=&quot;line 1 text&quot; mediatype=&quot;application/vnd.vizrt.richtext+xml&quot;&gt;&lt;value&gt;DOWNLOAD &#10;TV 2 SPORT APP&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;6768B5A8-E4BB-4543-8BA6038991FB316A&amp;gt;&quot; path=&quot;object*TekstBoks*LR_FAKTA*object*tv2fan*actionOMO*QUIZSTART*content*top*topText&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;text_col&quot; label=&quot;text_col&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/SPORTSCENTER/assets/colors/white&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;6768B5A8-E4BB-4543-8BA6038991FB316A&amp;gt;&quot; path=&quot;object*TekstBoks*LR_FAKTA*object*tv2fan*actionOMO*QUIZSTART*content*top*topText&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;bg_col&quot; label=&quot;bg_col&quot; mediatype=&quot;application/atom+xml;type=entry;media=image&quot;&gt;&lt;value&gt;&lt;entry xmlns=&quot;http://www.w3.org/2005/Atom&quot;&gt;&lt;content type=&quot;application/vnd.vizrt.viz.image&quot;&gt;IMAGE*/TV2/PILOT_TEMPLATES/2015_DESIGN/BUILD/elements/colors/2015_master_colors_NEWS&lt;/content&gt;&lt;/entry&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;FC203FB8-776E-4869-BFE1F7C2CD69D1A5&amp;gt;&quot; path=&quot;object*TekstBoks*LR_FAKTA*object*tv2fan*actionOMO*QUIZSTART*content*top*topBG&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;text_2&quot; label=&quot;linje 2 text&quot; mediatype=&quot;application/vnd.vizrt.richtext+xml&quot;&gt;&lt;value&gt;Læs mere på tv2.dk&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;0F0247C4-0C66-4870-B024F05A9A8CEFE9&amp;gt;&quot; path=&quot;object*TekstBoks*LR_FAKTA*object*tv2fan*actionOMO*QUIZSTART*content*headline*pixText*question&quot; /&gt;&lt;singleline xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; /&gt;&lt;/fielddef&gt;&lt;/schema&gt;&lt;/model&gt;</entry>
    </element>
    <element name="arkiv">
        <entry name="default_alternatives"/>
        <entry name="layers">
            <ref>/storage/shows/{66E45216-9476-4BDC-9556-C3DB487ED9DF}/sceneselectors/arkiv</ref>
        </entry>
        <entry name="model_xml">&lt;model xmlns=&quot;http://www.vizrt.com/types&quot;&gt;&lt;schema&gt;&lt;fielddef name=&quot;05&quot; label=&quot;direkte&quot; mediatype=&quot;application/vnd.vizrt.richtext+xml&quot;&gt;&lt;value&gt;DIREKTE&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;A8048202-A540-4E8A-BA8E6D39A8BC3DB7&amp;gt;&quot; path=&quot;object*grafik*out*direct*DirekteText*direkte&quot; /&gt;&lt;singleline xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; /&gt;&lt;uppercase xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; /&gt;&lt;/fielddef&gt;&lt;fielddef name=&quot;06&quot; label=&quot;location&quot; mediatype=&quot;application/vnd.vizrt.richtext+xml&quot;&gt;&lt;value&gt;&lt;/value&gt;&lt;container xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; uuid=&quot;&amp;lt;4EA223A4-7AD5-4684-95542B86CE2C0B96&amp;gt;&quot; path=&quot;object*grafik*out*location_group*LocationText*location&quot; /&gt;&lt;singleline xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; /&gt;&lt;uppercase xmlns=&quot;http://www.vizrt.com/2011/bgfx&quot; /&gt;&lt;/fielddef&gt;&lt;/schema&gt;&lt;/model&gt;</entry>
    </element>
	</entry>`

describe.only('Transform a non-entry', () => {

	test('For a show element', async () => {
		let fromXML = await Xml2JS.parseStringPromise(nonEntry)
		console.log(JSON.stringify(fromXML, null, 2))
		let flat = flattenEntry(fromXML)
		console.log(JSON.stringify(flat, null, 2))
	})

	test('For a few tempaltes', async () => {
		let fromXML = await Xml2JS.parseStringPromise(tempEntry)
		console.log(JSON.stringify(fromXML, null, 2))
		let flat = flattenEntry(fromXML)
		console.log(JSON.stringify(flat, null, 2))
	})
})
