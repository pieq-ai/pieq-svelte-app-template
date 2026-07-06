import * as notificationService from '$lib/server/services/notification.service.js';
import { templates } from './notification.templates.js';
import type { CreateNotificationDto } from '$lib/server/services/notification.service.js';

export const notificationFactory = {
	async employeeJoined(firstName: string, lastName: string, createdBy: string | null | undefined) {
		const payload = templates.employeeJoined(firstName, lastName);
		return notificationService.send({
			...payload,
			created_by: createdBy ?? null
		});
	},

	async holidayCreated(name: string, date: Date, createdBy: string | null | undefined) {
		const payload = templates.holidayCreated(name, date);
		return notificationService.send({
			...payload,
			created_by: createdBy ?? null
		});
	},

	async leaveApplied(
		firstName: string,
		lastName: string,
		totalDays: number,
		startDate: any,
		createdBy: string | null | undefined,
		requestCuid: string
	) {
		const payload = templates.leaveApplied(firstName, lastName, totalDays, startDate, requestCuid);
		return notificationService.send({
			...payload,
			created_by: createdBy ?? null
		});
	},

	async leaveApproved(
		totalDays: number,
		startDate: any,
		approverUserCuid: string,
		employeeCuid: string,
		requestCuid: string
	) {
		const payload = templates.leaveApproved(totalDays, startDate, employeeCuid, requestCuid);
		return notificationService.send({
			...payload,
			created_by: approverUserCuid
		});
	},

	async leaveRejected(
		totalDays: number,
		startDate: any,
		rejectorUserCuid: string,
		employeeCuid: string,
		requestCuid: string
	) {
		const payload = templates.leaveRejected(totalDays, startDate, employeeCuid, requestCuid);
		return notificationService.send({
			...payload,
			created_by: rejectorUserCuid
		});
	},

	async leaveWithdrawn(
		firstName: string,
		lastName: string,
		actorCuid: string | null | undefined,
		requestCuid: string
	) {
		const payload = templates.leaveWithdrawn(firstName, lastName, requestCuid);
		return notificationService.send({
			...payload,
			created_by: actorCuid ?? null
		});
	},

	async payrollProcessed(
		month: string | number,
		year: string | number,
		createdBy: string | null | undefined
	) {
		const payload = templates.payrollProcessed(month, year);
		return notificationService.send({
			...payload,
			created_by: createdBy ?? null
		});
	},

	async payrollFailed(
		month: string | number,
		year: string | number,
		skippedCount: number,
		uploadCuid: string,
		createdBy: string | null | undefined
	) {
		const payload = templates.payrollFailed(month, year, skippedCount, uploadCuid);
		return notificationService.send({
			...payload,
			created_by: createdBy ?? null
		});
	},

	async birthday(firstName: string, lastName: string, employeeCuid: string) {
		const payload = templates.birthday(firstName, lastName);
		payload.metadata = {
			...payload.metadata,
			employeeCuid
		};
		return notificationService.send(payload);
	},

	async workAnniversary(firstName: string, lastName: string, years: number, employeeCuid: string) {
		const payload = templates.workAnniversary(firstName, lastName, years);
		payload.metadata = {
			...payload.metadata,
			employeeCuid
		};
		return notificationService.send(payload);
	},

	async send(dto: CreateNotificationDto) {
		return notificationService.send(dto);
	}
};
