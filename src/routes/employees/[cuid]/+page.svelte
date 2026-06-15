<script lang="ts">
	import EmployeeWizard from '$lib/components/employee/EmployeeWizard.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();
	let employee = $derived(data.employee);
	let mode = $derived(($page.url.searchParams.get('mode') === 'edit' ? 'edit' : 'view') as 'edit' | 'view');
</script>

<svelte:head>
	<title>View Employee | {employee?.first_name} {employee?.last_name || ''}</title>
</svelte:head>

<EmployeeWizard {mode} employeeCuid={employee?.cuid} data={data} />
