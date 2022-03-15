export function wrapInBracesIfNeeded(value: string): string {
	if (!value.startsWith('{') && !value.endsWith('}')) {
		return `{${value}}`
	}
	return value
}

export function has(object: Record<string | number, any>, property: string | number): boolean {
	return Object.prototype.hasOwnProperty.call(object, property)
}
