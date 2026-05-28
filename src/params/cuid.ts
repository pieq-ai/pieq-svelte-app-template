export function match(param: string) {
	return /^c[a-z0-9]{24}$/i.test(param);
}

