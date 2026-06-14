import { localApi } from './local.js';

export interface ApplyLeavePayload {
	leaveTypeCuid: string;
	startDate: string;
	endDate: string;
	isHalfDay: boolean;
	halfDaySession?: string | null;
	reason?: string | null;
	document?: {
		fileName: string;
		mimeType: string;
		base64Data: string;
	} | null;
}

export const leavesApi = {
	getDetails: () => localApi.get<any>('/api/leaves'),
	applyLeave: (payload: ApplyLeavePayload) => localApi.post<any>('/api/leaves', payload),
	withdrawLeave: (cuid: string) => localApi.post<any>(`/api/leaves/${cuid}`, {}),
	approveOrRejectLeave: (cuid: string, action: 'approve' | 'reject') =>
		localApi.post<any>(`/api/leaves/approvals/${cuid}`, { action })
};
