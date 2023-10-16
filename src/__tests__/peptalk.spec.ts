import {
	startPepTalk,
	PepTalkClient,
	PepTalkJS,
	LocationType,
	Capability,
	UnspecifiedError,
	InexistentError,
	InvalidError,
	SyntaxError,
	NotAllowedError,
} from '../peptalk'
import * as Websocket from '../__mocks__/ws'
import { setupPeptalkMock } from '../__mocks__/peptalkMock'

let testPort = 1000

describe('PepTalk happy', () => {
	let pep: PepTalkClient & PepTalkJS
	testPort++
	setupPeptalkMock(testPort)

	beforeAll(async () => {
		// This "connects" to the Mocked peptalk (virtual) server:
		pep = startPepTalk('localhost', testPort)
		await pep.connect()
	})

	test('Ping', async () => {
		await expect(pep.ping()).resolves.toMatchObject({
			// id: 2,
			sent: 'get {1}/ 0',
			status: 'ok',
			body: 'PONG!',
		})
	})

	test('Send and un escape', async () => {
		await expect(pep.send('anything goes here')).resolves.toMatchObject({
			// id: 3,
			sent: 'anything goes here',
			status: 'ok',
			body: 'anything responds here',
		})
	})

	test('Send special', async () => {
		const toSend = 'åæ'
		expect(Buffer.byteLength(toSend, 'utf8')).toBe(4)
		await expect(pep.send(`special {4}${toSend}`)).resolves.toMatchObject({
			body: 'special åæ',
			// id: 4,
			sent: 'special {4}åæ',
			status: 'ok',
		})
	})

	test('Simple get', async () => {
		await expect(pep.get('/name/with/lines/1')).resolves.toMatchObject({
			body: '<entry depth="0" name="name"/>',
			// id: 5,
			sent: 'get {18}/name/with/lines/1',
			status: 'ok',
		})
	})

	test('Two line get', async () => {
		await expect(pep.get('/multi/with/lines/2', 2)).resolves.toMatchObject({
			body: '<entry depth="2" name="multi">something</entry>',
			// id: 6,
			sent: 'get {19}/multi/with/lines/2 2',
			status: 'ok',
		})
	})

	test('Three line get', async () => {
		await expect(pep.get('/multithree/with/lines/3', 7)).resolves.toMatchObject({
			body: '<entry depth="7" name="multithree">something</entry>',
			// id: 7,
			sent: 'get {24}/multithree/with/lines/3 7',
			status: 'ok',
		})
	})

	test('Multi chunk', async () => {
		await Promise.all([
			expect(pep.get('/multithree/with/lines/4', 7)).resolves.toMatchObject({
				body: '<entry depth="7" name="multithree">4</entry>',
				sent: 'get {24}/multithree/with/lines/4 7',
				status: 'ok',
			}),
			expect(pep.get('/multithree/with/lines/5', 7)).resolves.toMatchObject({
				body: '<entry depth="7" name="multithree">5</entry>',
				sent: 'get {24}/multithree/with/lines/5 7',
				status: 'ok',
			}),
			expect(pep.get('/multithree/with/lines/6', 7)).resolves.toMatchObject({
				body: '<entry depth="7" name="multithree">6</entry>',
				sent: 'get {24}/multithree/with/lines/6 7',
				status: 'ok',
			}),
			expect(pep.get('/multithree/with/lines/7', 7)).resolves.toMatchObject({
				body: '<entry depth="7" name="multithree">7</entry>',
				sent: 'get {24}/multithree/with/lines/7 7',
				status: 'ok',
			}),
		])
	})

	test('Copy', async () => {
		await expect(pep.copy('/copy/source', '/copy/destination', LocationType.First)).resolves.toMatchObject({
			body: 'destination',
			// id: 8,
			sent: 'copy {12}/copy/source {17}/copy/destination first',
			status: 'ok',
		})
	})

	test('Delete', async () => {
		await expect(pep.delete('/bye/bye/thingy')).resolves.toMatchObject({
			body: '',
			// id: 9,
			sent: 'delete {15}/bye/bye/thingy',
			status: 'ok',
		})
	})

	test('Ensure path', async () => {
		await expect(pep.ensurePath('/please/let/me/exist')).resolves.toMatchObject({
			body: '',
			// id: 10,
			sent: 'ensure-path {20}/please/let/me/exist',
			status: 'ok',
		})
	})

	test('Insert', async () => {
		await expect(pep.insert('/put/it/here', '<entry name="it"/>', LocationType.Last)).resolves.toMatchObject({
			body: 'it#2',
			// id: 11,
			sent: 'insert {12}/put/it/here last {18}<entry name="it"/>',
			status: 'ok',
		})
	})

	test('Move', async () => {
		await expect(
			pep.move('/move/from/source', '/move/to/destination', LocationType.Before, 'Fred')
		).resolves.toMatchObject({
			body: 'destination#2',
			// id: 12
			sent: 'move {17}/move/from/source {20}/move/to/destination before {4}Fred',
			status: 'ok',
		})
	})

	test('Two capabilities', async () => {
		await expect(pep.protocol([Capability.noevents, Capability.uri])).resolves.toMatchObject({
			body: 'protocol noevents uri peptalk treetalk',
			// id: 13,
			sent: 'protocol noevents uri',
			status: 'ok',
		})
	})

	test('One Capability', async () => {
		await expect(pep.protocol(Capability.noevents)).resolves.toMatchObject({
			body: 'protocol noevents uri peptalk treetalk',
			// id: 13,
			sent: 'protocol noevents',
			status: 'ok',
		})
	})

	test('No Capability', async () => {
		await expect(pep.protocol()).resolves.toMatchObject({
			body: 'protocol noevents uri peptalk treetalk',
			// id: 13,
			sent: 'protocol',
			status: 'ok',
		})
	})

	test('Reinitialize', async () => {
		await expect(pep.reintialize()).resolves.toMatchObject({
			sent: 'reinitialize',
			// id: 14,
			body: '',
			status: 'ok',
		})
	})

	test('Replace', async () => {
		await expect(pep.replace('/my/value/is/not/important', '<entry name="seeya"/>')).resolves.toMatchObject({
			body: 'seeya#2',
			// id: 15
			sent: 'replace {26}/my/value/is/not/important {21}<entry name="seeya"/>',
			status: 'ok',
		})
	})

	test('Set element value', async () => {
		await expect(pep.set('/give/me/a/new/value', 'bunny boots')).resolves.toMatchObject({
			body: '',
			// id: 16,
			sent: 'set text {20}/give/me/a/new/value {11}bunny boots',
			status: 'ok',
		})
	})

	test('Set attribute value', async () => {
		await expect(pep.set('/update/my/best/attribute', 'nose_size', '42')).resolves.toMatchObject({
			body: '42',
			// id: 17,
			sent: 'set attribute {25}/update/my/best/attribute {9}nose_size {2}42',
			status: 'ok',
		})
	})

	test('Uri', async () => {
		await expect(pep.uri('/my/home/in/pep', 'element_collection')).resolves.toMatchObject({
			body: 'http://localhost:8594/element_collection/storage/my/home/in/pep',
			// id: 18,
			sent: 'uri {15}/my/home/in/pep {18}element_collection',
			status: 'ok',
		})
	})

	test('GetJS', async () => {
		await expect(pep.getJS('/name/with/lines/1', 42)).resolves.toMatchObject({
			body: '<entry depth="42" name="name"/>',
			// id: 5,
			sent: 'get {18}/name/with/lines/1 42',
			status: 'ok',
			js: {
				entry: {
					$: {
						depth: '42',
						name: 'name',
					},
				},
			},
		})
	})

	afterAll(async () => {
		await pep.close()
	})
})

describe('PepTalk connection lifecycle', () => {
	let pep: PepTalkClient & PepTalkJS
	testPort++
	setupPeptalkMock(testPort)

	beforeAll(async () => {
		pep = startPepTalk('localhost', testPort)
	})

	test('Ping not connected', async () => {
		await expect(pep.ping()).rejects.toThrow('Not connected')
	})

	test('Connect and disconnect', async () => {
		await expect(pep.connect()).resolves.toMatchObject({
			body: 'protocol noevents uri peptalk treetalk',
			sent: 'protocol peptalk',
			status: 'ok',
		})
		await expect(pep.close()).resolves.toMatchObject({
			body: 'bye',
			sent: 'close',
			status: 'ok',
		})
		await expect(pep.ping()).rejects.toThrow('Not connected')
	})

	test('Connect twice', async () => {
		await expect(pep.connect()).resolves.toMatchObject({
			body: 'protocol noevents uri peptalk treetalk',
			sent: 'protocol peptalk',
			status: 'ok',
		})
		await expect(pep.connect()).resolves.toMatchObject({
			body: 'protocol noevents uri peptalk treetalk',
			sent: 'protocol peptalk',
			status: 'ok',
		})
		await expect(pep.close()).resolves.toMatchObject({
			body: 'bye',
			sent: 'close',
			status: 'ok',
		})
	})

	afterAll(async () => {
		await pep.close()
	})
})

describe('PepTalk server death', () => {
	let pep: PepTalkClient & PepTalkJS
	testPort++
	setupPeptalkMock(testPort)

	beforeAll(async () => {
		pep = startPepTalk('localhost', testPort)
		await pep.connect()
	})

	test('Ping check connected', async () => {
		await expect(pep.ping()).resolves.toMatchObject({
			// id: 2,
			sent: 'get {1}/ 0',
			status: 'ok',
			body: 'PONG!',
		})
	})

	test('Set timeout', () => {
		expect(pep).toMatchObject({
			hostname: 'localhost',
			port: testPort,
			timeout: 3000,
		})
		expect(pep.setTimeout(1000)).toBe(1000)
		expect(pep.timeout).toBe(1000)
		expect(pep.setTimeout(-1000)).toBe(1000)
		expect(pep.setTimeout(0)).toBe(1000)
		expect(pep.setTimeout(3000)).toBe(3000)
	})

	test('Close server and ping', async () => {
		expect(pep.setTimeout(300)).toBe(300)

		// Look up the mock server and close it:
		const instances = Websocket.getMockInstances().filter((i) => i.connectURL === `ws://localhost:${testPort}/`)
		expect(instances.length).toBeGreaterThanOrEqual(1)
		instances.forEach((instance) => {
			instance?.close()
		})

		await expect(pep.ping()).rejects.toThrow('Parallel promise to send message')
		expect(pep.setTimeout(3000)).toBe(3000)
	})

	afterAll(async () => {
		// await pep.close()
	})
})

describe('PepTalk with sadness', () => {
	let pep: PepTalkClient & PepTalkJS
	testPort++
	setupPeptalkMock(testPort)

	beforeAll(async () => {
		pep = startPepTalk('localhost', testPort)
		await pep.connect()
	})

	test('Ping check connected', async () => {
		await expect(pep.ping()).resolves.toMatchObject({
			// id: 2,
			sent: 'get {1}/ 0',
			status: 'ok',
			body: 'PONG!',
		})
	})

	test('Fall through to unspecified', async () => {
		await expect(pep.send('wibble')).rejects.toThrow(UnspecifiedError)
	})

	test('Get inexistent', async () => {
		await expect(pep.get('/mockError/inexistent', 3)).rejects.toThrow(InexistentError)
	})
	test('Get inexist', async () => {
		await expect(pep.get('/mockError/inexist', 3)).rejects.toThrow(InexistentError)
	})

	test('Get invalid', async () => {
		await expect(pep.get('/mockError/invalid', 3)).rejects.toThrow(InvalidError)
	})

	test('Get not allowed', async () => {
		await expect(pep.get('/mockError/not_allowed', 3)).rejects.toThrow(NotAllowedError)
	})

	test('Get syntax', async () => {
		await expect(pep.get('/mockError/syntax', 3)).rejects.toThrow(SyntaxError)
	})

	test('Get unspecified', async () => {
		await expect(pep.get('/mockError/unspecified', 3)).rejects.toThrow(UnspecifiedError)
	})

	afterAll(async () => {
		await pep.close()
	})
})
