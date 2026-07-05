import type { CreateNotificationDto } from '$lib/server/services/notification.service.js';

export type NotificationTemplatePayload = Omit<CreateNotificationDto, 'created_by'>;
