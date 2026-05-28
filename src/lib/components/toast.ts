import { toast as baseToast } from 'svelte-sonner';

export const toast = {
	success(message: string, description?: string) {
		return baseToast.success(message, {
			description,
			duration: 4000
		});
	},
	error(message: string, description?: string) {
		return baseToast.error(message, {
			description,
			duration: 5000
		});
	},
	info(message: string, description?: string) {
		return baseToast.info(message, {
			description,
			duration: 4000
		});
	},
	warning(message: string, description?: string) {
		return baseToast.warning(message, {
			description,
			duration: 4000
		});
	}
};
