const koa = require('koa')
const xml2js = require('xml2js')
const ws = require('ws')
const app = new koa()

let webby = new ws('ws://localhost:8595')
let counter = 2

webby.on('open', () => {
	console.log('Open')
	webby.send('1 protocol peptalk\n\n')
	app.listen(3000, () => console.log('Server listening.'))
})

async function getMessage(c) {
	let begin = false
	let ok = false
	let text = []
	return new Promise((resolve, reject) => {
		function processMessage(m) {
			if (m.startsWith(c)) {
				if (m.indexOf('begin') >= 0) {
					begin = true
					webby.once('message', processMessage)
					return
				}
				let star = m.indexOf('*')
				if (begin && m.indexOf('*') >= 0) {
					text.push(m.slice(star + 2))
					webby.once('message', processMessage)
					return
				}
				if (begin && m.indexOf('ok') >= 0) {
					ok = true
					resolve(text)
					return
				}
				if (begin) {
					return reject(m)
				}
				console.log('Unexpected message', m)
				webby.once('message', processMessage)
			} else {
				console.log('Not processing', m)
				webby.once('message', processMessage)
			}
		}
		webby.once('message', processMessage)
	})
}

app.use(async function (ctx) {
	console.log(ctx.path)
	if (ctx.path.endsWith('.js') || ctx.path.endsWith('.ico')) return
	webby.send(`${counter} get {${ctx.path.length}}${ctx.path} 10\n\n`)
	let result = await getMessage(`${counter++}`)
	ctx.body = result
})

webby.on('upgrade', () => {
	console.log('Upgrade')
})

process.on('SIGHUP', () => {
	app.close()
	webby.close()
})
