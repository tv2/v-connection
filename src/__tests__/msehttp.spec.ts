import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as request from 'request-promise-native'
import * as http from 'http'
import * as uuid from 'uuid'
import { createHTTPContext, HttpMSEClient } from '../msehttp'
import { URL } from 'url'

const testPort = 4317

const wait = (t: number) => new Promise<void>((resolve) => {
	setTimeout(resolve, t)
})

describe('MSE HTTP library', () => {

	let app: Koa
	let server: http.Server
	let msehttp: HttpMSEClient

	beforeAll(async () => {
		app = new Koa()
		msehttp = createHTTPContext('SOFIE', 'localhost', testPort)

		app.use(bodyParser({ enableTypes: [ 'text' ] }))
		app.use(async ctx => {
			// console.log(ctx)
			if (ctx.path === '/') {
				ctx.body = 'Look at me'
			}
			if (ctx.path === '/profiles/SOFIE') { // Ping test
				ctx.body = '<profile/>'
			}
			if (ctx.path.startsWith('/profiles/SOFIE/initialize')) {
				if (ctx.headers['content-type'] !== 'text/plain') {
					throw new Error('Missing content header.')
				}
				let body = ctx.request.body
				ctx.body = `Scheduled initialization and activation of ${body}.`
				return
			}
			if (ctx.path.startsWith('/profiles/SOFIE/cleanup')) {
				if (ctx.headers['content-type'] !== 'text/plain') {
					throw new Error('Missing content header.')
				}
				let body = ctx.request.body
				ctx.body = `Scheduled cleanup and deactivation of ${body}.`
				return
			}
			if (ctx.path.startsWith('/profiles/SOFIE/timeout')) {
				await wait(msehttp.timeout + 200)
				ctx.body = 'This is far too late'
				return
			}
			if (ctx.path.startsWith('/profiles/SOFIE/')) {
				let command = ctx.path.slice(16)
				if (ctx.headers['content-type'] !== 'text/plain') {
					throw new Error('Missing content header.')
				}
				let body = ctx.request.body
				if (!body.endsWith(command)) {
					throw new Error('Command name is not as expected')
				}
				ctx.body = `Scheduled ${command} on ${body.toString()}.\r\n`
			}
		})

		await new Promise((resolve, _reject) => {
			server = app.listen(testPort, () => { resolve() })
		})
	})

	test('MSE is created', () => {
		expect(msehttp).toMatchObject({
			timeout: 3000,
			port: 4317,
			host: 'localhost',
			profile: 'SOFIE',
			baseURL: 'http://localhost:4317/profiles/SOFIE'
		})
	})

	test('Basic connection test', async () => {
		let fromMe = await request(`http://localhost:${testPort}`)
		expect(fromMe).toBe('Look at me')
	})

	test('Ping test', async () => {
		let pingResult = await msehttp.ping()
		expect(pingResult).toMatchObject({ status: 200, response: 'PONG!' })
	})

	test('Cue', async () => {
		let cueResult = await msehttp.cue('/an/element/to/cue')
		expect(cueResult).toMatchObject({
			status: 200,
			response: 'Scheduled cue on /an/element/to/cue.\r\n'
		})
	})

	test('Take', async () => {
		let takeResult = await msehttp.take('/an/element/to/take')
		expect(takeResult).toMatchObject({
			status: 200,
			response: 'Scheduled take on /an/element/to/take.\r\n'
		})
	})

	test('Out', async () => {
		let outResult = await msehttp.out('/an/element/to/out')
		expect(outResult).toMatchObject({
			status: 200,
			response: 'Scheduled out on /an/element/to/out.\r\n'
		})
	})

	test('Continue', async () => {
		let contResult = await msehttp.continue('/an/element/to/continue')
		expect(contResult).toMatchObject({
			status: 200,
			response: 'Scheduled continue on /an/element/to/continue.\r\n'
		})
	})

	test('Continue reverse', async () => {
		let crResult = await msehttp.continueReverse('/an/element/to/continue_reverse')
		expect(crResult).toMatchObject({
			status: 200,
			response: 'Scheduled continue_reverse on /an/element/to/continue_reverse.\r\n'
		})
	})

	test('Initialize playlist', async () => {
		let playlistID = uuid.v4().toUpperCase()
		let initResult = await msehttp.initializePlaylist(playlistID)
		expect(initResult).toMatchObject({
			status: 200,
			response: `Scheduled initialization and activation of /storage/playlists/{${playlistID}}.`
		})
	})

	test('Cleanup playlist', async () => {
		let playlistID = uuid.v4().toUpperCase()
		let cleanResult = await msehttp.cleanupPlaylist(playlistID)
		expect(cleanResult).toMatchObject({
			status: 200,
			response: `Scheduled cleanup and deactivation of /storage/playlists/{${playlistID}}.`
		})
	})

	test('Cleanup show', async () => {
		let showID = uuid.v4().toUpperCase()
		let initResult = await msehttp.cleanupShow(showID)
		expect(initResult).toMatchObject({
			status: 200,
			response: `Scheduled cleanup and deactivation of /storage/shows/{${showID}}.`
		})
	})

	test('Take with URL', async () => {
		let takeResult = await msehttp.command(
			new URL(`http://localhost:${testPort}/profiles/SOFIE/take`),
			'/an/element/to/take')
		expect(takeResult).toMatchObject({
			status: 200,
			response: 'Scheduled take on /an/element/to/take.\r\n'
		})
	})

	test('Change timeout', () => {
		msehttp.setHTTPTimeout(1234)
		expect(msehttp.timeout).toBe(1234)
		msehttp.setHTTPTimeout(3000)
		expect(msehttp.timeout).toBe(3000)
	})

	test('Trigger timeout', async () => {
		msehttp.setHTTPTimeout(300)
		expect(msehttp.timeout).toBe(300)
		await expect(msehttp.command('timeout', '/running/out/of/time')).rejects.toThrow('ESOCKETTIMEDOUT')
		msehttp.setHTTPTimeout(3000)
		expect(msehttp.timeout).toBe(3000)
	})

	afterAll(async () => {
		await new Promise((resolve, reject) => {
			server.close((err) => {
				if (err) return reject(err)
				resolve()
			})
		})
	})
})
