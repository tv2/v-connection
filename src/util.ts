export function wrapInBracesIfNeeded(value: string): string {
	if (!value.startsWith('{') && !value.endsWith('}')) {
		return `{${value}}`
	}
	return value
}
