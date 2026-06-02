import { toast as baseToast } from 'svelte-sonner';
import SuccessIcon from './SuccessIcon.svelte';
import ErrorIcon from './ErrorIcon.svelte';
import InfoIcon from './InfoIcon.svelte';
import WarningIcon from './WarningIcon.svelte';

export const toast = {
	success(message: string, description?: string) {
		return baseToast.success(message, {
			description,
			duration: 4000,
			icon: SuccessIcon
		});
	},
	error(message: string, description?: string) {
		return baseToast.error(message, {
			description,
			duration: 5000,
			icon: ErrorIcon
		});
	},
	info(message: string, description?: string) {
		return baseToast.info(message, {
			description,
			duration: 4000,
			icon: InfoIcon
		});
	},
	warning(message: string, description?: string) {
		return baseToast.warning(message, {
			description,
			duration: 4000,
			icon: WarningIcon
		});
	}
};
