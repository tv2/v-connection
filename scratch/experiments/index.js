const ws = require('ws')

let webby = new ws('ws://192.168.1.3:8595')

webby.on('open', () => {
	console.log('Open')
	webby.send('1 protocol peptalk\n\n')
})

webby.on('upgrade', () => {
	console.log('Upgrade')
})

webby.on('message', (m) => {
	if (m.indexOf('status') < 0) console.log('message:', m)
})

let state =
	'STATE_<entry name="LOWER">\n' +
	'    <entry name="object">TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/bund</entry>\n' +
	'    <entry name="location">$object</entry>\n' +
	'    <entry name="state">NAME</entry>\n' +
	'    <entry name="data">\n' +
	'        <entry type="richtext" name="08">æøå ÆØÅ</entry>\n' +
	'        <entry type="richtext" name="10">aASDF</entry>\n' +
	'    </entry>\n' +
	'</entry>\n'

setTimeout(() => {
	webby.send(
		'2 set attribute {67}/storage/shows/{3CA3F632-A13D-4F33-B57F-953850BDF6BB}/elements/2481 take_count 57\n\n'
	)
	webby.send(
		`3 set text /scheduler/localhost/state/background/TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/MASTER/LOWER/current {${state.length}}${state}\n\n`
	)
	webby.send(
		`4 set text /scheduler/localhost/state/background/TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/MASTER/LOWER/state/current NAME\n\n`
	)
}, 5000)

setTimeout(() => {
	webby.send(
		'5 set text /scheduler/localhost/state/background/TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/MASTER/LOWER/current out\n\n'
	)
	webby.send(
		'6 set text /scheduler/localhost/state/background/TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/MASTER/LOWER/state/current O\n\n'
	)
}, 10000)

setTimeout(() => {
	console.log('The end')
	webby.close()
}, 200000)

process.on('SIGHUP', webby.close)
