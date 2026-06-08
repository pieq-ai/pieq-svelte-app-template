import { browser } from '$app/environment';

export const toast = {
	success: async (msg: string) => {
		if (!browser) return;
		const { toast: sonnerToast } = await import('svelte-sonner');
		sonnerToast.success(msg);
	},
	error: async (msg: string) => {
		if (!browser) return;
		const { toast: sonnerToast } = await import('svelte-sonner');
		sonnerToast.error(msg);
	},
	info: async (msg: string) => {
		if (!browser) return;
		const { toast: sonnerToast } = await import('svelte-sonner');
		sonnerToast.info(msg);
	},
	warning: async (msg: string) => {
		if (!browser) return;
		const { toast: sonnerToast } = await import('svelte-sonner');
		sonnerToast.warning(msg);
	}
};
