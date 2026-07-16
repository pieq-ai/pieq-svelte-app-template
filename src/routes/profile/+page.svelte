<script lang="ts">
	import EmployeeWizard from '$lib/components/employee/EmployeeWizard.svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { globalIsDirty } from '$lib/stores/navigationGuard';
	import { toast } from 'svelte-sonner';

	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>My Profile</title>
</svelte:head>

<EmployeeWizard
	mode="self"
	employeeCuid={data.employee.cuid}
	data={data}
/>
