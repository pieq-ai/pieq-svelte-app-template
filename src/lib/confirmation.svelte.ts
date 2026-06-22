// src/lib/confirmation.svelte.ts

class ConfirmationManager {
	show = $state(false);
	title = $state('');
	message = $state('');
	confirmText = $state('Confirm');
	cancelText = $state('Cancel');
	isDestructive = $state(false);
	onConfirm = $state<() => void | Promise<void>>(() => {});
	onCancel = $state<() => void>(() => {});

	ask(options: {
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		isDestructive?: boolean;
		onConfirm: () => void | Promise<void>;
		onCancel?: () => void;
	}) {
		this.title = options.title;
		this.message = options.message;
		this.confirmText = options.confirmText ?? 'Confirm';
		this.cancelText = options.cancelText ?? 'Cancel';
		this.isDestructive = options.isDestructive ?? false;
		this.onConfirm = async () => {
			await options.onConfirm();
			this.show = false;
		};
		this.onCancel = () => {
			options.onCancel?.();
			this.show = false;
		};
		this.show = true;
	}
}

export const confirmation = new ConfirmationManager();
