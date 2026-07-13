import { SvelteSet } from 'svelte/reactivity';

export function createValidationState<T extends string = string>() {
	let touchedFields = new SvelteSet<T>();
	let submissionAttempted = $state(false);

	return {
		markTouched(fieldName: T) {
			touchedFields.add(fieldName);
		},
		markAttempted() {
			submissionAttempted = true;
		},
		isTouched(fieldName: T) {
			return submissionAttempted;
		},
		shouldShowError(fieldName: T, error: string | null | undefined | boolean) {
			return submissionAttempted && !!error;
		},
		reset() {
			touchedFields.clear();
			submissionAttempted = false;
		}
	};
}
