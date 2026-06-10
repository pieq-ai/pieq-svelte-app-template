import { db } from '$lib/server/db.js';
import type { MasterKey } from '$lib/master-data/master-config.js';

export interface MasterCreateInput {
	name: string;
	country_cuid?: string;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export interface MasterUpdateInput {
	id: bigint;
	name: string;
	country_cuid?: string;
	updated_by?: string;
	updated_at?: Date | string;
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
			return db.state.findMany({ orderBy: [{ country_cuid: 'asc' }, { state_name: 'asc' }] });
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

export async function findById(master: MasterKey, id: bigint) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.findUnique({ where: { id } });
		case 'pay-grades':
			return db.payGrade.findUnique({ where: { id } });
		case 'nationalities':
			return db.nationality.findUnique({ where: { id } });
		case 'employment-types':
			return db.employmentType.findUnique({ where: { id } });
		case 'relation-types':
			return db.relationType.findUnique({ where: { id } });
		case 'document-types':
			return db.documentType.findUnique({ where: { id } });
		case 'states':
			return db.state.findUnique({ where: { id } });
		case 'countries':
			return db.country.findUnique({ where: { id } });
		case 'skills':
			return db.skills.findUnique({ where: { id } });
		case 'attendance-sources':
			return db.attendanceSource.findUnique({ where: { id } });
		case 'languages':
			return db.languages.findUnique({ where: { id } });
	}
}

export async function findByCuid2(master: MasterKey, cuid: string) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.findUnique({ where: { cuid } });
		case 'pay-grades':
			return db.payGrade.findUnique({ where: { cuid } });
		case 'nationalities':
			return db.nationality.findUnique({ where: { cuid } });
		case 'employment-types':
			return db.employmentType.findUnique({ where: { cuid } });
		case 'relation-types':
			return db.relationType.findUnique({ where: { cuid } });
		case 'document-types':
			return db.documentType.findUnique({ where: { cuid } });
		case 'states':
			return db.state.findUnique({ where: { cuid } });
		case 'countries':
			return db.country.findUnique({ where: { cuid } });
		case 'skills':
			return db.skills.findUnique({ where: { cuid } });
		case 'attendance-sources':
			return db.attendanceSource.findUnique({ where: { cuid } });
		case 'languages':
			return db.languages.findUnique({ where: { cuid } });
	}
}

export async function create(master: MasterKey, data: MasterCreateInput) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.create({ data: { blood_group_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'pay-grades':
			return db.payGrade.create({ data: { paygrade_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'nationalities':
			return db.nationality.create({ data: { nationality_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'employment-types':
			return db.employmentType.create({ data: { employment_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'relation-types':
			return db.relationType.create({ data: { relation_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'document-types':
			return db.documentType.create({ data: { document_type_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'states':
			return db.state.create({ data: { state_name: data.name, country_cuid: data.country_cuid ?? '', created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'countries':
			return db.country.create({ data: { country_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'skills':
			return db.skills.create({ data: { skills_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'attendance-sources':
			return db.attendanceSource.create({ data: { attendance_source_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'languages':
			return db.languages.create({ data: { languages_name: data.name, created_by: data.created_by ?? undefined, updated_by: data.created_by ?? undefined, created_at: data.created_at ? new Date(data.created_at) : undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
	}
}

export async function update(master: MasterKey, data: MasterUpdateInput) {
	switch (master) {
		case 'blood-groups':
			return db.bloodGroup.update({ where: { id: data.id }, data: { blood_group_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'pay-grades':
			return db.payGrade.update({ where: { id: data.id }, data: { paygrade_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'nationalities':
			return db.nationality.update({ where: { id: data.id }, data: { nationality_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'employment-types':
			return db.employmentType.update({ where: { id: data.id }, data: { employment_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'relation-types':
			return db.relationType.update({ where: { id: data.id }, data: { relation_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'document-types':
			return db.documentType.update({ where: { id: data.id }, data: { document_type_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'states':
			return db.state.update({ where: { id: data.id }, data: { state_name: data.name, country_cuid: data.country_cuid ?? '', updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'countries':
			return db.country.update({ where: { id: data.id }, data: { country_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'skills':
			return db.skills.update({ where: { id: data.id }, data: { skills_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'attendance-sources':
			return db.attendanceSource.update({ where: { id: data.id }, data: { attendance_source_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
		case 'languages':
			return db.languages.update({ where: { id: data.id }, data: { languages_name: data.name, updated_by: data.updated_by ?? undefined, updated_at: data.updated_at ? new Date(data.updated_at) : undefined } });
	}
}
