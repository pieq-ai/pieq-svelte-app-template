import { writable } from 'svelte/store';

export const globalIsDirty = writable(false);
