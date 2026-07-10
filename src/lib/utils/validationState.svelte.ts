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
			return touchedFields.has(fieldName) || submissionAttempted;
		},
		shouldShowError(fieldName: T, error: string | null | undefined | boolean) {
			return (touchedFields.has(fieldName) || submissionAttempted) && !!error;
		},
		reset() {
			touchedFields.clear();
			submissionAttempted = false;
		}
	};
}
