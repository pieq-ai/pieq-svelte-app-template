export function match(param: string) {
	return /^c[a-z0-9]{8,}$/i.test(param);
}
