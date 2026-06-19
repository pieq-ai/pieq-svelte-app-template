/**
 * crudEngine.svelte.ts
 * 
 * Reusable abstract CRUD engine for generic entity management.
 * Handles table filtering, sorting, pagination, form validation, and dirty checking.
 */
import { createDirtyChecker } from '$lib/utils';
import { globalIsDirty } from '$lib/stores/navigationGuard';
import { localApi, ApiError } from '$lib/api/local';
import { toast } from '$lib/toast';

export interface CrudConfig<T, F> {
	entityName: string;
	endpoint: string;
	searchFields: (keyof T)[];
	defaultSortColumn?: keyof T | string;
	
	defaultFormValues: F;
	mapEntityToForm: (entity: T) => F;
	mapFormToPayload: (form: F) => any;
	validate: (form: F) => Record<keyof F | string, string>;
}

export function createCrudEngine<T extends { cuid: string; status?: boolean }, F extends Record<string, any>>(config: CrudConfig<T, F>) {
	let items = $state<T[]>([]);
	let isLoading = $state(true);
	
	// Table State
	let searchQuery = $state('');
	let statusFilter = $state<'all' | boolean>('all');
	let sortColumn = $state<keyof T | string>(config.defaultSortColumn ?? 'cuid');
	let sortDirection = $state<'asc' | 'desc' | null>(null);
	let currentPage = $state(1);
	let pageSize = $state(10);

	// Modal & Form State
	let isModalOpen = $state(false);
	let editingItem = $state<T | null>(null);
	let formValues = $state<F>(structuredClone(config.defaultFormValues));
	let isSubmitting = $state(false);
	let backendError = $state('');
	let isFormTouched = $state(false);
	let itemToDelete = $state<T | null>(null);
	let isDeleting = $state(false);

	const dirtyChecker = createDirtyChecker<F>();
	let isDirty = $derived(isModalOpen && dirtyChecker.isDirty(formValues));
	
	// Bind to global navigation guard
	$effect(() => {
		globalIsDirty.set(isDirty);
	});

	// Derived Table States
	let filteredItems = $derived.by(() => {
		let result = [...items];
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((item) => config.searchFields.some(field => {
				const val = item[field];
				return val && String(val).toLowerCase().includes(query);
			}));
		}
		if (statusFilter !== 'all') {
			result = result.filter((item) => item.status === statusFilter);
		}
		if (sortDirection && sortColumn) {
			result.sort((a, b) => {
				const valA = a[sortColumn as keyof T];
				const valB = b[sortColumn as keyof T];
				if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
				if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;
				if (typeof valA === 'string' && typeof valB === 'string') {
					return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
				}
				if (typeof valA === 'boolean' && typeof valB === 'boolean') {
					return sortDirection === 'asc' ? (valA === valB ? 0 : valA ? 1 : -1) : (valA === valB ? 0 : valA ? -1 : 1);
				}
				return 0;
			});
		}
		return result;
	});

	let paginatedItems = $derived(filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	let validationErrors = $derived(isFormTouched ? config.validate(formValues) : {});
	let hasErrors = $derived(Object.values(validationErrors).some(err => err !== ''));

	async function load() {
		isLoading = true;
		try {
			const res = await localApi.get<{ data: T[] }>(`${config.endpoint}?includeInactive=true`);
			items = res.data ?? [];
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : `Failed to load ${config.entityName.toLowerCase()}s.`);
		} finally {
			isLoading = false;
		}
	}

	function handleSort(column: keyof T | string) {
		if (sortColumn === column) {
			if (sortDirection === 'asc') sortDirection = 'desc';
			else if (sortDirection === 'desc') sortDirection = null;
			else sortDirection = 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function openCreate() {
		editingItem = null;
		formValues = structuredClone(config.defaultFormValues);
		isFormTouched = false;
		backendError = '';
		dirtyChecker.snapshot(structuredClone(config.defaultFormValues));
		isModalOpen = true;
	}

	function openEdit(item: T) {
		editingItem = item;
		const mapped = config.mapEntityToForm(item);
		formValues = structuredClone(mapped);
		isFormTouched = false;
		backendError = '';
		dirtyChecker.snapshot(structuredClone(mapped));
		isModalOpen = true;
	}

	async function save(e?: Event) {
		if (e) e.preventDefault();
		if (editingItem && !isDirty) return;
		isFormTouched = true;
		if (hasErrors) return;

		isSubmitting = true;
		backendError = '';
		try {
			const payload = config.mapFormToPayload(formValues);
			if (editingItem) {
				await localApi.put(`${config.endpoint}/${editingItem.cuid}`, payload);
			} else {
				await localApi.post(config.endpoint, payload);
			}
			await load();
			toast.success(`${config.entityName} ${editingItem ? 'updated' : 'created'} successfully`);
			isModalOpen = false;
			globalIsDirty.set(false);
		} catch (err) {
			backendError = err instanceof ApiError ? err.message : 'Something went wrong.';
			toast.error(backendError);
		} finally {
			isSubmitting = false;
		}
	}

	async function confirmDelete() {
		if (!itemToDelete) return;
		isDeleting = true;
		try {
			await localApi.delete(`${config.endpoint}/${itemToDelete.cuid}`);
			await load();
			toast.success(`${config.entityName} deactivated successfully`);
			itemToDelete = null;
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : `Failed to deactivate ${config.entityName.toLowerCase()}.`);
		} finally {
			isDeleting = false;
		}
	}

	return {
		get items() { return items; },
		get isLoading() { return isLoading; },
		get filteredItems() { return filteredItems; },
		get paginatedItems() { return paginatedItems; },
		get totalCount() { return items.length; },
		get activeCount() { return items.filter(i => i.status === true).length; },
		get inactiveCount() { return items.filter(i => i.status === false).length; },

		get searchQuery() { return searchQuery; },
		set searchQuery(v) { searchQuery = v; currentPage = 1; },
		get statusFilter() { return statusFilter; },
		set statusFilter(v) { statusFilter = v; currentPage = 1; },
		get sortColumn() { return sortColumn; },
		get sortDirection() { return sortDirection; },
		get currentPage() { return currentPage; },
		set currentPage(v) { currentPage = v; },
		get pageSize() { return pageSize; },
		set pageSize(v) { pageSize = v; },

		get isModalOpen() { return isModalOpen; },
		set isModalOpen(v) { 
			isModalOpen = v; 
			if (!v) globalIsDirty.set(false);
		},
		get editingItem() { return editingItem; },
		get formValues() { return formValues; },
		set formValues(v) { formValues = v; },
		get isSubmitting() { return isSubmitting; },
		get backendError() { return backendError; },
		set backendError(v) { backendError = v; },
		get validationErrors() { return validationErrors; },
		get isDirty() { return isDirty; },

		get itemToDelete() { return itemToDelete; },
		set itemToDelete(v) { itemToDelete = v; },
		get isDeleting() { return isDeleting; },

		load,
		handleSort,
		openCreate,
		openEdit,
		save,
		confirmDelete
	};
}
