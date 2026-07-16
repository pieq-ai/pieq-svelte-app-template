import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function deepEqual(obj1: any, obj2: any): boolean {
	if (obj1 === obj2) return true;
	if (obj1 === null || obj2 === null) return false;
	if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

	if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

	if (Array.isArray(obj1)) {
		if (obj1.length !== obj2.length) return false;
		for (let i = 0; i < obj1.length; i++) {
			if (!deepEqual(obj1[i], obj2[i])) return false;
		}
		return true;
	}

	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) return false;

	for (const key of keys1) {
		if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
		if (!deepEqual(obj1[key], obj2[key])) return false;
	}

	return true;
}

export function createDirtyChecker<T>() {
	let original: T | null = null;
	return {
		snapshot(data: T) {
			original = structuredClone(data);
		},
		isDirty(currentData: T) {
			return !deepEqual(original, currentData);
		}
	};
}

export * from './utils/validationState.svelte.js';
