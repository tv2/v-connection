const ws = require('ws')
const net = require('net')
let socket = new net.Socket()

socket.connect({ host: '192.168.1.3', port: 8594 })
socket.on('listening', () => {
	console.log('ready', () => {
		socket.write('1 protocol treetalk schedule paths\n\n')
	})
})

let webby = new ws('ws://192.168.1.3:8595')

webby.on('open', () => {
	console.log('Open 1')
	webby.send('1 protocol peptalk\n\n')
})

webby.on('upgrade', () => {
	console.log('Upgrade 1')
})

webby.on('message', (m) => {
	if (m.indexOf('/scheduler status') < 0) console.log('message1:', m)
})

socket.setEncoding('utf8')
socket.on('data', (m) => console.log('message2:', m))

let state =
	'STATE_<entry name="LOWER">\n' +
	'    <entry name="object">TV2/PILOT_TEMPLATES/SPORT/OL2016/overlays/Bund</entry>\n' +
	'    <entry name="location">$object</entry>\n' +
	'    <entry name="state">IN</entry>\n' +
	'    <entry name="data">\n' +
	'        <entry name="20">Fred Flintstone</entry>\n' +
	'        <entry name="21">Sofie Developer</entry>\n' +
	'    </entry>\n' +
	'</entry>\n'

// setTimeout(() => {
//   // webby.send('2 set attribute {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 status prequeue\n\n')
//   webby.send('3 set attribute {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 status prequeue\n\n')
//   webby.send('4 set attribute {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 take_count 12\n\n')
//   webby.send('5 set text {72}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/last_taken_element {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0\n\n')
//   webby.send(`6 set text {96}/scheduler/Viz A/state/background/TV2/PILOT_TEMPLATES/SPORT/OL2016/overlays/MASTER/LOWER/current {${state.length}}${state}\n\n`);
//   webby.send(`7 set text {102}/scheduler/Viz A/state/background/TV2/PILOT_TEMPLATES/SPORT/OL2016/overlays/MASTER/LOWER/state/current IN\n\n`);
//   // webby.send('6 set attribute {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 status {0}\n\n')
// }, 5000)

// setTimeout(() => {
//   webby.send('5 set text /scheduler/localhost/state/background/TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/MASTER/LOWER/current out\n\n')
//   webby.send('6 set text /scheduler/localhost/state/background/TV2/PILOT_TEMPLATES/2015_DESIGN/NYHEDERNE/overlays/MASTER/LOWER/state/current O\n\n')
// }, 10000)

setTimeout(() => {
	// webby.send('2 set text {96}/scheduler/Viz A/state/background/TV2/PILOT_TEMPLATES/SPORT/OL2016/overlays/MASTER/LOWER/current out\n\n');
	// webby.send('3 set text {102}/scheduler/Viz A/state/background/TV2/PILOT_TEMPLATES/SPORT/OL2016/overlays/MASTER/LOWER/state/current O\n\n');
}, 5000)

setTimeout(() => {
	socket.write(
		'4 schedule {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 {0} schedule 0 {0} profile /config/profiles/MOSART viz {5}Viz A command take show {62}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements \n\n'
	)
	//          42 schedule {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 {0} schedule 0 {0} profile /config/profiles/MOSART viz {5}Viz A command take show {62}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements
}, 6000)

setTimeout(() => {
	console.log('The end')
	webby.close()
	socket.close()
}, 200000)

/* 20 schedule {112}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0 {0}
     schedule 0 {0} profile /config/profiles/MOSART viz {5}Viz A command out show {62}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements */

process.on('SIGHUP', () => {
	webby.close()
	socket.close()
})
