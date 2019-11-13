import { startPepTalk, PepTalkClient, PepTalkJS } from '../peptalk'
import * as websocket from 'ws'

const testPort = 8418

const extractIndex = (s: string): string => {
	let firstSpace = s.indexOf(' ')
	return firstSpace > 0 ? s.slice(0, firstSpace) : ''
}

describe('PepTalk happy', () => {

	let server: websocket.Server
	let pep: PepTalkClient & PepTalkJS

	beforeAll(async () => {
		server = new websocket.Server({ port: testPort })
		server.on('connection', ws => {
			ws.on('message', (message: string) => {
				console.log('Received', message)
				let index = extractIndex(message)
				if (message === '1 protocol peptalk\r\n') {
					return ws.send('1 protocol peptalk noevents')
				}
				if (message.indexOf('close') >= 0) {
					ws.send(`${index} ok bye`)
					return ws.close()
				}
				if (message.indexOf('get {1}/ 0') >= 0) {
					return ws.send(`${index} ok <entry name="pongy"/>\r\n`)
				}
				if (message.indexOf('anything goes here') >= 0) {
					let response = 'responds here'
					return ws.send(`${index} ok anything {${response.length}}${response}\r\n`)
				}
				if (message.indexOf('special') >= 0) {
					let response = message.slice(message.indexOf('special') + 8).trim()
					return ws.send(`${index} ok special ${response}\r\n`)
				}
				if (message.indexOf('get') >= 0) {
					let bits = message.match(/\d+\sget\s\{\d+\}\/(\w+)\/with\/lines\/(\d)\s?(\d+)?.*/)
					let depth = typeof bits[3] !== 'undefined' ? bits[3] : '0'
					let name = bits[1]
					if (bits[2] === '2') {
						let value = `<entry depth="${depth}" name="${name}">something</entry>`
						ws.send(`${index} ok {${value.length}}${value.slice(0, 13)}\r\n`)
						return ws.send(`${value.slice(13)}\r\n`)
					}
					return ws.send(`${index} ok <entry depth="${depth}" name="${name}"/>`)
				}
				return ws.send(`${index} error unexpected`)
			})
		})

		pep = startPepTalk('localhost', testPort)
		await pep.connect()
	})

	test('Ping', async () => {
		let result = await pep.ping()
		expect(result).toMatchObject({
			// id: 2,
			sent: 'get {1}/ 0',
			status: 'ok',
			body: 'PONG!'
		})
	})

	test('Send and un escape', async () => {
		await expect(pep.send('anything goes here')).resolves.toMatchObject({
			// id: 3,
			sent: 'anything goes here',
			status: 'ok',
			body: 'anything responds here'
		})
	})

	test('Send special', async () => {
		let toSend = 'åæ'
		expect(Buffer.byteLength(toSend, 'utf8')).toBe(4)
		await expect(pep.send(`special {4}${toSend}`)).resolves.toMatchObject({
			body: 'special åæ',
			// id: 4,
			sent: 'special {4}åæ',
			status: 'ok'
		})
	})

	test('Simple get', async () => {
		await expect(pep.get('/name/with/lines/1')).resolves.toMatchObject({
			body: '<entry depth="0" name="name"/>',
			// id: 5,
			sent: 'get {18}/name/with/lines/1',
			status: 'ok'
		})
	})

	test('Two line get', async () => {
		await expect(pep.get('/multi/with/lines/2', 2)).resolves.toMatchObject({
			body: '<entry depth="2" name="multi">something</entry>',
			// id: 6,
			sent: 'get {19}/multi/with/lines/2 2',
			status: 'ok'
		})
	})

	afterAll(async () => {
		await pep.close()
		return new Promise((resolve, reject) => {
			server.close((err) => {
				if (err) return reject(err)
				resolve()
			})
		})
	})
})
