export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}

class ToastStore {
	list = $state<Toast[]>([]);

	add(message: string, type: Toast['type'] = 'info', duration = 3000) {
		const id = Math.random().toString(36).substring(2, 9);
		const toast: Toast = { id, message, type, duration };
		this.list = [...this.list, toast];

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
		this.list = this.list.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
