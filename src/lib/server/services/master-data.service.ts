import { getMasterConfig, isMasterKey, type MasterKey } from '$lib/master-data/master-config.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

export interface MasterDataDto {
	name: string;
	country_cuid2?: string;
}

export interface MasterDataOption {
	id: string;
	label: string;
	master: MasterKey;
	meta?: Record<string, number | string>;
}

function resolveMaster(key: string): MasterKey {
	if (!isMasterKey(key)) {
		throw new Error('Unsupported master data type');
	}
	return key;
}

function normalizeName(name: string | null | undefined, master: MasterKey) {
	if (name === undefined || name === null) {
		throw new Error(`${getMasterConfig(master).label} is required`);
	}

	const trimmed = name.trim().replace(/\s+/g, ' ');
	if (!trimmed) {
		throw new Error(`${getMasterConfig(master).label} is required`);
	}

	if (trimmed.length > 100) {
		throw new Error(`${getMasterConfig(master).label} cannot exceed 100 characters`);
	}

	if (master === 'blood-groups') {
		const bloodGroup = trimmed.toUpperCase();
		if (!/^(A|B|AB|O)[+-]$/.test(bloodGroup)) {
			throw new Error('Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-');
		}
		return bloodGroup;
	}

	if (master === 'languages') {
		if (!/^[\p{L} ]+$/u.test(trimmed)) {
			throw new Error('Language must contain only letters and spaces');
		}
		return trimmed;
	}

	if (!/^[A-Za-z0-9 ]+$/.test(trimmed)) {
		throw new Error(`${getMasterConfig(master).label} must contain only letters, numbers, and spaces`);
	}

	return trimmed;
}

function readId(record: Record<string, unknown>, master: MasterKey) {
	return Number(record[getMasterConfig(master).idField]);
}

function readCuid2(record: Record<string, unknown>) {
	return String(record.cuid2 ?? '');
}

function readName(record: Record<string, unknown>, master: MasterKey) {
	return String(record[getMasterConfig(master).nameField] ?? '');
}

function toOption(record: Record<string, unknown>, master: MasterKey): MasterDataOption {
	const option: MasterDataOption = {
		id: readCuid2(record),
		label: readName(record, master),
		master
	};

	return option;
}

async function resolveStateCountryId(dto: MasterDataDto) {
	if (!dto.country_cuid2) {
		throw new Error('Country CUID2 is required');
	}

	const country = (await masterDataDao.findByCuid2('countries', dto.country_cuid2)) as
		| Record<string, unknown>
		| null;
	if (!country) {
		throw new Error('Country not found');
	}

	return readId(country, 'countries');
}

async function ensureUnique(master: MasterKey, name: string, countryId?: number, currentCuid2?: string) {
	const records = (await masterDataDao.list(master)) as Record<string, unknown>[];
	const normalizedName = name.trim().toLowerCase();
	const duplicate = records.find((record) => {
		const isSameRecord = readCuid2(record) === currentCuid2;
		const isSameName = readName(record, master).trim().toLowerCase() === normalizedName;
		const isSameCountry = master !== 'states' || Number(record.country_id) === Number(countryId);
		return !isSameRecord && isSameName && isSameCountry;
	});

	if (duplicate) {
		throw new Error(`${getMasterConfig(master).label} already exists`);
	}
}

export async function getMasterData(masterKey: string, search?: string, countryCuid2?: string) {
	const master = resolveMaster(masterKey);
	const records = (await masterDataDao.list(master)) as Record<string, unknown>[];
	const query = search?.trim().toLowerCase() ?? '';
	let countryId: number | undefined;
	if (master === 'states' && countryCuid2) {
		const country = (await masterDataDao.findByCuid2('countries', countryCuid2)) as
			| Record<string, unknown>
			| null;
		if (!country) {
			throw new Error('Country not found');
		}
		countryId = readId(country, 'countries');
	}

	return records
		.filter((record) => {
			if (master === 'states' && countryId && Number(record.country_id) !== countryId) {
				return false;
			}
			return !query || readName(record, master).toLowerCase().includes(query);
		})
		.map((record) => toOption(record, master));
}

export async function createMasterData(masterKey: string, dto: MasterDataDto) {
	const master = resolveMaster(masterKey);
	const name = normalizeName(dto.name, master);
	let countryId: number | undefined;

	if (master === 'states') {
		countryId = await resolveStateCountryId(dto);
	}

	await ensureUnique(master, name, countryId);

	const created = (await masterDataDao.create(master, {
		name,
		country_id: countryId
	})) as Record<string, unknown>;

	return toOption(created, master);
}

export async function updateMasterData(masterKey: string, cuid2: string, dto: MasterDataDto) {
	const master = resolveMaster(masterKey);

	const existing = (await masterDataDao.findByCuid2(master, cuid2)) as Record<string, unknown> | null;
	if (!existing) {
		throw new Error(`${getMasterConfig(master).label} not found`);
	}

	const name = normalizeName(dto.name, master);
	let countryId: number | undefined;

	if (master === 'states') {
		countryId = await resolveStateCountryId(dto);
	}

	await ensureUnique(master, name, countryId, cuid2);

	const updated = (await masterDataDao.update(master, {
		id: readId(existing, master),
		name,
		country_id: countryId
	})) as Record<string, unknown>;

	return toOption(updated, master);
}
