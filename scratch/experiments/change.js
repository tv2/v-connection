const ws = require('ws')

let webby = new ws('ws://localhost:8595');

webby.on('open', () => {
  console.log('Open');
  webby.send('1 protocol peptalk\n\n');
});

webby.on('upgrade', () => {
  console.log('Upgrade');
});

webby.on('message', m => { if (m.indexOf('status') < 0) console.log('message:', m) });

function generateId () {
  let s = '';
  for ( let x = 0 ; x < 20 ; x++ ) {
    let r = Math.random();
    let l = r * 26 | 0;
    s += String.fromCharCode(97 + l);
  }
  return s;
}

let id = generateId();
let counter = 2;

let path = `/mseq_internal/${id}`;
let entry = `<entry name="${id}"/>`;

let env = `<env command="take" profile="/config/profiles/Rejse set 2">
  <element complete="false" description="Name 1/Titel 1 " layer="BUND" showautodescription="false" templatedescription="LGFX_BUNDT" name="1000">
    <ref name="master_template">/storage/shows/{34DC9293-9728-4857-AD47-9675D14C25C7}/mastertemplates/BUNDT</ref>
    <entry name="default_alternatives"/>
    <entry name="data">
      <entry name="20">${process.argv[2]}</entry>
      <entry name="21">${process.argv[3]}</entry>
    </entry>
    <entry name="dblink">
      <entry name="20"/>
      <entry name="21"/>
    </entry>
    <entry name="settings">
      <entry name="tabfields">
        <entry name="20"/>
        <entry name="21"/>
      </entry>
      <entry name="isfilescript">false</entry>
      <entry name="modified">${(new Date()).toISOString().slice(0, -5)}</entry>
    </entry>
    <entry usage="updating" name="payload_xml">&lt;payload xmlns=&quot;http://www.vizrt.com/types&quot;&gt;&lt;field name=&quot;20&quot;&gt;&lt;value&gt;${process.argv[2]}&lt;/value&gt;&lt;/field&gt;&lt;field name=&quot;21&quot;&gt;&lt;value&gt;${process.argv[3]}&lt;/value&gt;&lt;/field&gt;&lt;/payload&gt;</entry>
  </element>
</env>`

console.log(env);

setTimeout(() => {
  webby.send(`${counter++} insert ${path} last {${entry.length}}${entry}\n\n`);
  webby.send(`${counter++} insert ${path}/env last {${env.length}}${env}\n\n`)
}, 5000)

setTimeout(() => {
  console.log('The end');
  webby.close();
}, 10000);

process.on('SIGHUP', webby.close);
