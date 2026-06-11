<script lang="ts">
	import EmployeeWizard from '$lib/components/employee/EmployeeWizard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { employee } = $derived(data);
</script>

<svelte:head>
	<title>View Employee | {employee?.first_name} {employee?.last_name || ''}</title>
</svelte:head>

<EmployeeWizard mode="view" employeeCuid={employee?.cuid} data={data} />
