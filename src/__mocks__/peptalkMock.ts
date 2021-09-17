import * as Websocket from './ws'

export function setupPeptalkMock(port: number): void {
	Websocket.mockConstructor((url: string, ws: Websocket) => {
		// Mock a peptalk server on port 1234:
		if (url === `ws://localhost:${port}/`) {
			ws.mockReplyFunction((message: any) => {
				if (typeof message !== 'string') throw new Error('Mock: message should be a string')

				// console.log('Received', message)

				const index = extractIndex(message)
				if (message === '1 protocol peptalk\r\n') {
					return '1 protocol peptalk noevents'
					// return `${index} protocol peptalk uri`
				} else if (message.indexOf('close') >= 0) {
					ws.setTimeout(() => {
						ws.close()
					}, 1)
					return `${index} ok bye`
				} else if (message.indexOf('get {1}/ 0') >= 0) {
					return `${index} ok <entry name="pongy"/>\r\n`
				} else if (message.indexOf('anything goes here') >= 0) {
					const response = 'responds here'
					return `${index} ok anything {${response.length}}${response}\r\n`
				} else if (message.indexOf('special') >= 0) {
					const response = message.slice(message.indexOf('special') + 8).trim()
					return `${index} ok special ${response}\r\n`
				} else if (message.indexOf('get') >= 0) {
					if (message.match(/mockError/)) {
						const m = message.match(/mockError\/([^\s]*)/)
						if (m) {
							const errorName = m[1]
							const path = message.slice(message.indexOf('/'), message.lastIndexOf(' '))
							return `${index} error ${errorName} ${path}\r\n`
						} else {
							throw new Error('Peptalk mock: bad request')
						}
					}

					const bits = message.match(/\d+\sget\s\{\d+\}\/(\w+)\/with\/lines\/(\d)\s?(\d+)?.*/) as RegExpMatchArray
					const depth = typeof (bits[3] as string | undefined) === 'string' ? bits[3] : '0'
					const name = bits[1]
					if (bits[2] === '2') {
						const value = `<entry depth="${depth}" name="${name}">something</entry>`
						return [`${index} ok {${value.length}}${value.slice(0, 13)}\r\n`, `${value.slice(13)}\r\n`]
					} else if (bits[2] === '3') {
						const value = `<entry depth="${depth}" name="${name}">something</entry>`
						return [
							`${index} ok {${value.length}}${value.slice(0, 13)}\r\n`,
							`${value.slice(13, 14)}\r\n`,
							`${value.slice(14)}\r\n`,
						]
					} else if (bits[2] === '4' || bits[2] === '5' || bits[2] === '6') {
						return []
					} else if (bits[2] === '7') {
						const value = (id: number) => `<entry depth="${depth}" name="${name}">${id}</entry>`
						return [
							`${+index - 3} ok {${value(4).length}}${value(4)}\r\n${+index - 2} ok {${value(5).length}}${value(
								5
							)}\r\n${+index - 1} ok {${value(6).length}}${value(6).slice(0, 13)}`,
							`${value(6).slice(13)}\r\n`,
							`${index} ok {${value(7).length}}${value(7)}\r\n`,
						]
					} else {
						return `${index} ok <entry depth="${depth}" name="${name}"/>\r\n`
					}
				} else if (message.indexOf('copy') >= 0) {
					let destination = message.slice(message.lastIndexOf('/') + 1)
					destination = destination.slice(0, destination.indexOf(' '))
					return `${index} ok ${destination}\r\n`
				} else if (message.indexOf('delete') >= 0) {
					// let endOfLife = message.slice(message.lastIndexOf('/') + 1).trim()
					return `${index} ok\r\n`
				} else if (message.indexOf('ensure-path') >= 0) {
					return `${index} ok\r\n`
				} else if (message.indexOf('insert') >= 0) {
					const nameMatch = message.match(/name="(\w+)"/) as RegExpMatchArray
					return `${index} ok ${nameMatch[1]}#2\r\n`
				} else if (message.indexOf('move') >= 0) {
					const destMatch = message.match(/\/move\/to\/(\w+)\s/) as RegExpMatchArray
					return `${index} ok ${destMatch[1]}#2`
				} else if (message.indexOf('protocol') >= 0) {
					return `${index} protocol noevents uri peptalk treetalk`
				} else if (message.indexOf('reinitialize') >= 0) {
					return `${index} ok`
				} else if (message.indexOf('replace') >= 0) {
					const nameMatch = message.match(/name="(\w+)"/) as RegExpMatchArray
					return `${index} ok ${nameMatch[1]}#2\r\n`
				} else if (message.indexOf('set text') >= 0) {
					return [`${index} begin`, `* ${message.slice(message.indexOf(' ') + 1)}`, `${index} ok\r\n`]
				} else if (message.indexOf('set attribute') >= 0) {
					return [`${index} begin`, `* ${message.slice(message.indexOf(' ') + 1)}`, `${index} ok 42\r\n`]
				} else if (message.indexOf('uri ') >= 0) {
					return `${index} ok http://localhost:8594/element_collection/storage/my/home/in/pep`
				}
				return `${index} error unspecified`
			})
			ws.mockSetConnected(true)
		}
	})
}

function extractIndex(s: string): string {
	const firstSpace = s.indexOf(' ')
	return firstSpace > 0 ? s.slice(0, firstSpace) : ''
}
