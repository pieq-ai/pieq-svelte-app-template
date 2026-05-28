import { db } from '$lib/server/db.js';
import type { MasterKey } from '$lib/master-data/master-config.js';

export interface MasterCreateInput {
	name: string;
	country_id?: number;
}

export interface MasterUpdateInput {
	id: number;
	name: string;
	country_id?: number;
}

export async function list(master: MasterKey) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.findMany({ orderBy: { blood_group_name: 'asc' } });
		case 'pay-grades':
			return db.payGrade.findMany({ orderBy: { paygrade_name: 'asc' } });
		case 'nationalities':
			return db.nationality.findMany({ orderBy: { nationality_name: 'asc' } });
		case 'employment-types':
			return db.employmentType.findMany({ orderBy: { employment_name: 'asc' } });
		case 'relation-types':
			return db.relationType.findMany({ orderBy: { relation_name: 'asc' } });
		case 'document-types':
			return db.documentType.findMany({ orderBy: { document_type_name: 'asc' } });
		case 'states':
			return db.state.findMany({ orderBy: [{ country_id: 'asc' }, { state_name: 'asc' }] });
		case 'countries':
			return db.country.findMany({ orderBy: { country_name: 'asc' } });
		case 'skills':
			return db.skills.findMany({ orderBy: { skills_name: 'asc' } });
		case 'attendance-sources':
			return db.attendanceSource.findMany({ orderBy: { attendance_source_name: 'asc' } });
		case 'languages':
			return db.languages.findMany({ orderBy: { languages_name: 'asc' } });
	}
}

export async function findById(master: MasterKey, id: number) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.findUnique({ where: { blood_group_id: id } });
		case 'pay-grades':
			return db.payGrade.findUnique({ where: { paygrade_id: id } });
		case 'nationalities':
			return db.nationality.findUnique({ where: { nationality_id: id } });
		case 'employment-types':
			return db.employmentType.findUnique({ where: { employment_type_id: id } });
		case 'relation-types':
			return db.relationType.findUnique({ where: { relation_id: id } });
		case 'document-types':
			return db.documentType.findUnique({ where: { document_type_id: id } });
		case 'states':
			return db.state.findUnique({ where: { state_id: id } });
		case 'countries':
			return db.country.findUnique({ where: { country_id: id } });
		case 'skills':
			return db.skills.findUnique({ where: { skills_id: id } });
		case 'attendance-sources':
			return db.attendanceSource.findUnique({ where: { attendance_source_id: id } });
		case 'languages':
			return db.languages.findUnique({ where: { languages_id: id } });
	}
}

export async function findByCuid2(master: MasterKey, cuid2: string) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.findUnique({ where: { cuid2 } });
		case 'pay-grades':
			return db.payGrade.findUnique({ where: { cuid2 } });
		case 'nationalities':
			return db.nationality.findUnique({ where: { cuid2 } });
		case 'employment-types':
			return db.employmentType.findUnique({ where: { cuid2 } });
		case 'relation-types':
			return db.relationType.findUnique({ where: { cuid2 } });
		case 'document-types':
			return db.documentType.findUnique({ where: { cuid2 } });
		case 'states':
			return db.state.findUnique({ where: { cuid2 } });
		case 'countries':
			return db.country.findUnique({ where: { cuid2 } });
		case 'skills':
			return db.skills.findUnique({ where: { cuid2 } });
		case 'attendance-sources':
			return db.attendanceSource.findUnique({ where: { cuid2 } });
		case 'languages':
			return db.languages.findUnique({ where: { cuid2 } });
	}
}

export async function create(master: MasterKey, data: MasterCreateInput) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.create({ data: { blood_group_name: data.name } });
		case 'pay-grades':
			return db.payGrade.create({ data: { paygrade_name: data.name } });
		case 'nationalities':
			return db.nationality.create({ data: { nationality_name: data.name } });
		case 'employment-types':
			return db.employmentType.create({ data: { employment_name: data.name } });
		case 'relation-types':
			return db.relationType.create({ data: { relation_name: data.name } });
		case 'document-types':
			return db.documentType.create({ data: { document_type_name: data.name } });
		case 'states':
			return db.state.create({ data: { state_name: data.name, country_id: data.country_id ?? 0 } });
		case 'countries':
			return db.country.create({ data: { country_name: data.name } });
		case 'skills':
			return db.skills.create({ data: { skills_name: data.name } });
		case 'attendance-sources':
			return db.attendanceSource.create({ data: { attendance_source_name: data.name } });
		case 'languages':
			return db.languages.create({ data: { languages_name: data.name } });
	}
}

export async function update(master: MasterKey, data: MasterUpdateInput) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.update({ where: { blood_group_id: data.id }, data: { blood_group_name: data.name } });
		case 'pay-grades':
			return db.payGrade.update({ where: { paygrade_id: data.id }, data: { paygrade_name: data.name } });
		case 'nationalities':
			return db.nationality.update({ where: { nationality_id: data.id }, data: { nationality_name: data.name } });
		case 'employment-types':
			return db.employmentType.update({ where: { employment_type_id: data.id }, data: { employment_name: data.name } });
		case 'relation-types':
			return db.relationType.update({ where: { relation_id: data.id }, data: { relation_name: data.name } });
		case 'document-types':
			return db.documentType.update({ where: { document_type_id: data.id }, data: { document_type_name: data.name } });
		case 'states':
			return db.state.update({ where: { state_id: data.id }, data: { state_name: data.name, country_id: data.country_id ?? 0 } });
		case 'countries':
			return db.country.update({ where: { country_id: data.id }, data: { country_name: data.name } });
		case 'skills':
			return db.skills.update({ where: { skills_id: data.id }, data: { skills_name: data.name } });
		case 'attendance-sources':
			return db.attendanceSource.update({ where: { attendance_source_id: data.id }, data: { attendance_source_name: data.name } });
		case 'languages':
			return db.languages.update({ where: { languages_id: data.id }, data: { languages_name: data.name } });
	}
}
