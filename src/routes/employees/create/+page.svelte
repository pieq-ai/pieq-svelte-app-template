<script lang="ts">
	import EmployeeWizard from '$lib/components/employee/EmployeeWizard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Add Employee</title>
</svelte:head>

<EmployeeWizard mode="create" data={data} />
