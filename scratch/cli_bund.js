const got = require('got')
const ws = require('ws')

let webby = new ws('ws://1d8dab0e.ngrok.io/')

let change = `<entry name="data">
    <entry name="20">${process.argv[2]}</entry>
    <entry name="21">${process.argv[3]}</entry>
</entry>`

webby.on('open', () => {
	console.log('Open 1')
	webby.send('1 protocol peptalk noevents\n\n')
	webby.send(
		`2 get {117}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0/data\n\n`
	)
	webby.send(
		`3 replace {117}/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0/data {${change.length}}${change}\n\n`
	)

	setTimeout(() => {
		got({
			method: 'POST',
			url: 'http://62918c05.ngrok.io/profiles/MOSART/take',
			body: '/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0',
		})
		console.log('>>> Take requested')
	}, 500)

	setTimeout(() => {
		got({
			method: 'POST',
			url: 'http://62918c05.ngrok.io/profiles/MOSART/out',
			body: '/storage/shows/{239F365A-5671-43F3-AD44-D44EB7C4F206}/elements/100_NYHEDERNE-TEST.SOFIE.VIZ-ELEMENTER_271DB363_0',
		})
		console.log('>>> Out requested')
	}, 10500)
})

webby.on('upgrade', () => {
	console.log('Upgrade 1')
})

webby.on('message', (m) => console.log('>>>', m))

process.on('SIGHUP', webby.close)
