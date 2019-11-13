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
					ws.send('1 protocol peptalk noevents')
				}
				if (message.indexOf('close') >= 0) {
					ws.send(`${index} ok bye`)
					ws.close()
				}
				if (message.indexOf('get {1}/ 0') >= 0) {
					ws.send(`${index} ok <entry name="pongy"/>\r\n`)
				}
			})
		})

		pep = startPepTalk('localhost', testPort)
		await pep.connect()
	})

	test('Ping', async () => {
		console.log('About to send a ping')
		let result = await pep.ping()
		expect(result).toMatchObject({
			id: 2,
			sent: 'get {1}/ 0',
			status: 'ok',
			body: 'PONG!'
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
