export const masterKeys = [
	'blood-groups',
	'pay-grades',
	'nationalities',
	'employment-types',
	'relation-types',
	'document-types',
	'states',
	'countries',
	'skills',
	'attendance-sources',
	'languages'
] as const;

export type MasterKey = (typeof masterKeys)[number];

export interface MasterConfig {
	key: MasterKey;
	label: string;
	idField: string;
	nameField: string;
	requiresCountry?: boolean;
}

export const masterConfigs: Record<MasterKey, MasterConfig> = {
	'blood-groups': {
		key: 'blood-groups',
		label: 'Blood Group',
		idField: 'id',
		nameField: 'name'
	},
	'pay-grades': {
		key: 'pay-grades',
		label: 'Pay Grade',
		idField: 'id',
		nameField: 'name'
	},
	nationalities: {
		key: 'nationalities',
		label: 'Nationality',
		idField: 'id',
		nameField: 'name'
	},
	'employment-types': {
		key: 'employment-types',
		label: 'Employment Type',
		idField: 'id',
		nameField: 'name'
	},
	'relation-types': {
		key: 'relation-types',
		label: 'Relation Type',
		idField: 'id',
		nameField: 'name'
	},
	'document-types': {
		key: 'document-types',
		label: 'Document Type',
		idField: 'id',
		nameField: 'name'
	},
	states: {
		key: 'states',
		label: 'State',
		idField: 'id',
		nameField: 'name',
		requiresCountry: true
	},
	countries: {
		key: 'countries',
		label: 'Country',
		idField: 'id',
		nameField: 'name'
	},
	skills: {
		key: 'skills',
		label: 'Skill',
		idField: 'id',
		nameField: 'name'
	},
	'attendance-sources': {
		key: 'attendance-sources',
		label: 'Attendance Source',
		idField: 'id',
		nameField: 'name'
	},
	languages: {
		key: 'languages',
		label: 'Language',
		idField: 'id',
		nameField: 'name'
	}
};

export function isMasterKey(value: string): value is MasterKey {
	return masterKeys.includes(value as MasterKey);
}

export function getMasterConfig(key: MasterKey) {
	return masterConfigs[key];
}
