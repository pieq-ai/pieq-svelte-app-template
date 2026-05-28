import { getMasterConfig, isMasterKey, type MasterKey } from '$lib/master-data/master-config.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

export interface MasterDataDto {
	name: string;
	country_id?: number;
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

function readName(record: Record<string, unknown>, master: MasterKey) {
	return String(record[getMasterConfig(master).nameField] ?? '');
}

function toOption(record: Record<string, unknown>, master: MasterKey): MasterDataOption {
	const option: MasterDataOption = {
		id: String(readId(record, master)),
		label: readName(record, master),
		master
	};

	if (master === 'states') {
		option.meta = {
			country_id: Number(record.country_id)
		};
	}

	return option;
}

function validateId(id: number, label: string) {
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error(`${label} must be a positive integer`);
	}
}

async function validateStateCountry(dto: MasterDataDto) {
	validateId(Number(dto.country_id), 'Country ID');
	const country = await masterDataDao.findById('countries', Number(dto.country_id));
	if (!country) {
		throw new Error('Country not found');
	}
}

async function ensureUnique(master: MasterKey, name: string, countryId?: number, currentId?: number) {
	const records = (await masterDataDao.list(master)) as Record<string, unknown>[];
	const normalizedName = name.trim().toLowerCase();
	const duplicate = records.find((record) => {
		const isSameRecord = readId(record, master) === currentId;
		const isSameName = readName(record, master).trim().toLowerCase() === normalizedName;
		const isSameCountry = master !== 'states' || Number(record.country_id) === Number(countryId);
		return !isSameRecord && isSameName && isSameCountry;
	});

	if (duplicate) {
		throw new Error(`${getMasterConfig(master).label} already exists`);
	}
}

export async function getMasterData(masterKey: string, search?: string, countryId?: number) {
	const master = resolveMaster(masterKey);
	const records = (await masterDataDao.list(master)) as Record<string, unknown>[];
	const query = search?.trim().toLowerCase() ?? '';

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

	if (master === 'states') {
		await validateStateCountry(dto);
	}

	await ensureUnique(master, name, dto.country_id);

	const created = (await masterDataDao.create(master, {
		name,
		country_id: dto.country_id
	})) as Record<string, unknown>;

	return toOption(created, master);
}

export async function updateMasterData(masterKey: string, id: number, dto: MasterDataDto) {
	const master = resolveMaster(masterKey);
	validateId(id, `${getMasterConfig(master).label} ID`);

	const existing = await masterDataDao.findById(master, id);
	if (!existing) {
		throw new Error(`${getMasterConfig(master).label} not found`);
	}

	const name = normalizeName(dto.name, master);

	if (master === 'states') {
		await validateStateCountry(dto);
	}

	await ensureUnique(master, name, dto.country_id, id);

	const updated = (await masterDataDao.update(master, {
		id,
		name,
		country_id: dto.country_id
	})) as Record<string, unknown>;

	return toOption(updated, master);
}
