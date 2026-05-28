// src/lib/toast.svelte.ts

export interface Toast {
	id: string;
	type: 'success' | 'info' | 'error' | 'warning';
	message: string;
	duration?: number;
}

class ToastManager {
	toasts = $state<Toast[]>([]);

	add(message: string, type: Toast['type'] = 'info', duration = 3000) {
		const id = Math.random().toString(36).substring(2, 9);
		this.toasts.push({ id, type, message, duration });
		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}
	}

	success(message: string, duration = 3000) {
		this.add(message, 'success', duration);
	}

	error(message: string, duration = 4000) {
		this.add(message, 'error', duration);
	}

	info(message: string, duration = 3000) {
		this.add(message, 'info', duration);
	}

	warning(message: string, duration = 3500) {
		this.add(message, 'warning', duration);
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastManager();
