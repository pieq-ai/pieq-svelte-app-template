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
		idField: 'blood_group_id',
		nameField: 'blood_group_name'
	},
	'pay-grades': {
		key: 'pay-grades',
		label: 'Pay Grade',
		idField: 'paygrade_id',
		nameField: 'paygrade_name'
	},
	nationalities: {
		key: 'nationalities',
		label: 'Nationality',
		idField: 'nationality_id',
		nameField: 'nationality_name'
	},
	'employment-types': {
		key: 'employment-types',
		label: 'Employment Type',
		idField: 'employment_type_id',
		nameField: 'employment_name'
	},
	'relation-types': {
		key: 'relation-types',
		label: 'Relation Type',
		idField: 'relation_id',
		nameField: 'relation_name'
	},
	'document-types': {
		key: 'document-types',
		label: 'Document Type',
		idField: 'document_type_id',
		nameField: 'document_type_name'
	},
	states: {
		key: 'states',
		label: 'State',
		idField: 'state_id',
		nameField: 'state_name',
		requiresCountry: true
	},
	countries: {
		key: 'countries',
		label: 'Country',
		idField: 'country_id',
		nameField: 'country_name'
	},
	skills: {
		key: 'skills',
		label: 'Skill',
		idField: 'skills_id',
		nameField: 'skills_name'
	},
	'attendance-sources': {
		key: 'attendance-sources',
		label: 'Attendance Source',
		idField: 'attendance_source_id',
		nameField: 'attendance_source_name'
	},
	languages: {
		key: 'languages',
		label: 'Language',
		idField: 'languages_id',
		nameField: 'languages_name'
	}
};

export function isMasterKey(value: string): value is MasterKey {
	return masterKeys.includes(value as MasterKey);
}

export function getMasterConfig(key: MasterKey) {
	return masterConfigs[key];
}
