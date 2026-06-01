export function mapToApi(entity: any): any {
	if (Array.isArray(entity)) return entity.map(mapToApi);
	if (entity === null || typeof entity !== 'object' || entity instanceof Date) return entity;

	const mapped: any = {};
	for (const [key, value] of Object.entries(entity)) {
		if (key.endsWith('cuid2')) {
			const newKey = key.replace(/cuid2$/, 'cuid');
			mapped[newKey] = mapToApi(value);
		} else {
			mapped[key] = mapToApi(value);
		}
	}
	return mapped;
}

export function mapToDb(payload: any): any {
	if (Array.isArray(payload)) return payload.map(mapToDb);
	if (payload === null || typeof payload !== 'object' || payload instanceof Date) return payload;

	const mapped: any = {};
	for (const [key, value] of Object.entries(payload)) {
		if (key.endsWith('cuid')) {
			const newKey = key.replace(/cuid$/, 'cuid2');
			mapped[newKey] = mapToDb(value);
		} else {
			mapped[key] = mapToDb(value);
		}
	}
	return mapped;
}
