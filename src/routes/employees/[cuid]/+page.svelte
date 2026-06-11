<script lang="ts">
	import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from '$lib/components';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import EditIcon from '@lucide/svelte/icons/edit';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { employee, employment } = $derived(data);
</script>

<svelte:head>
	<title>View Employee | {employee.first_name} {employee.last_name}</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-8">
	<div class="flex items-center justify-between border-b border-border pb-6">
		<div class="space-y-1 flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/employees">
				<ArrowLeftIcon class="size-4" />
			</Button>
			<div>
				<Badge variant="secondary" class="uppercase">Employee Details</Badge>
				<h1 class="text-3xl font-bold tracking-tight sm:text-4xl mt-1">
					{employee.first_name} {employee.last_name || ''}
				</h1>
				<p class="text-muted-foreground">
					Employee Code: #{employee.emp_code}
				</p>
			</div>
		</div>
		<div>
			<Button href="/employees/edit/{employee.cuid}" variant="outline">
				<EditIcon class="mr-2 size-4" />
				Edit Details
			</Button>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Personal Information</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-muted-foreground">First Name</p>
						<p class="font-medium">{employee.first_name}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Last Name</p>
						<p class="font-medium">{employee.last_name || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Email</p>
						<p class="font-medium">{employee.personal_email || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Mobile No.</p>
						<p class="font-medium">{employee.mobile_no || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Profile Status</p>
						<Badge variant={employee.profile_completion_status === 'completed' ? 'default' : 'secondary'}>
							{employee.profile_completion_status?.toUpperCase() || 'PENDING'}
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Employment Details</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if employment}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-muted-foreground">Status</p>
							<Badge variant={employment.employment_status === 'active' ? 'default' : 'secondary'}>
								{employment.employment_status.toUpperCase()}
							</Badge>
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Official Email</p>
							<p class="font-medium">{employment.official_email || '-'}</p>
						</div>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No employment records found.</p>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
