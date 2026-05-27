<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		Input,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state('');
	let isSubmitting = $state(false);
	let successMessage = $state('');

	// Active Edit Mode Detection from URL query parameter
	let editUuid = $derived(page.url.searchParams.get('edit'));
	let editingGroup = $derived(data.bloodGroups.find((bg) => bg.uuid === editUuid));

	// Form local state
	let bloodGroupName = $state('');

	// Synchronise form inputs when URL edit parameter changes
	$effect(() => {
		if (form && 'action' in form && form.action === 'update' && 'uuid' in form && form.uuid === editUuid) {
			if ('blood_group_name' in form) bloodGroupName = String(form.blood_group_name);
		} else if (form && 'action' in form && form.action === 'create' && !editUuid) {
			if ('blood_group_name' in form) bloodGroupName = String(form.blood_group_name);
		} else if (editingGroup) {
			bloodGroupName = editingGroup.blood_group_name;
		} else {
			bloodGroupName = '';
		}
	});

	let formError = $derived(form && 'error' in form ? form.error : null);

	// Filtered list
	let filteredGroups = $derived.by(() => {
		let result = [...data.bloodGroups];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(bg) =>
					bg.blood_group_name.toLowerCase().includes(query) ||
					bg.uuid.toLowerCase().includes(query)
			);
		}

		// Sort by ID ascending
		result.sort((a, b) => a.id - b.id);

		return result;
	});

	let totalGroups = $derived(data.bloodGroups.length);

	function confirmDelete(event: SubmitEvent) {
		if (!confirm('Are you sure you want to delete this blood group?')) {
			event.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>Blood Groups | HRMS</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-1 py-4">
	<!-- Header -->
	<div class="space-y-1 border-b border-border pb-6">
		<Badge variant="secondary" class="uppercase">HRMS Module</Badge>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Blood Groups</h1>
		<p class="text-muted-foreground">
			Manage system-wide blood groups for employee profiles.
		</p>
	</div>

	<!-- KPI Metrics -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader>
				<CardDescription>Total Registered Groups</CardDescription>
				<CardTitle class="text-4xl tabular-nums">{totalGroups}</CardTitle>
			</CardHeader>
		</Card>
	</div>

	<div class="grid items-start gap-8 lg:grid-cols-3">
		<!-- Left: Table & Search -->
		<div class="space-y-4 lg:col-span-2">
			<!-- Search control -->
			<div class="relative">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search by name..."
					bind:value={searchQuery}
					class="pl-9 pr-9"
				/>
				{#if searchQuery}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						class="absolute top-1/2 right-1 -translate-y-1/2"
						aria-label="Clear search"
						onclick={() => (searchQuery = '')}
					>
						<XIcon class="size-4" />
					</Button>
				{/if}
			</div>

			<!-- Blood Groups List Card -->
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="w-24">ID</TableHead>
							<TableHead>Blood Group Name</TableHead>
							<TableHead class="w-48">UUID</TableHead>
							<TableHead class="w-24 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if filteredGroups.length === 0}
							<TableRow>
								<TableCell colspan={4} class="py-12 text-center text-muted-foreground">
									No blood groups found.
								</TableCell>
							</TableRow>
						{:else}
							{#each filteredGroups as group (group.uuid)}
								<TableRow>
									<TableCell class="font-medium">#{group.id}</TableCell>
									<TableCell class="font-semibold">{group.blood_group_name}</TableCell>
									<TableCell class="font-mono text-xs text-muted-foreground">
										{group.uuid}
									</TableCell>
									<TableCell class="text-right space-x-1">
										<!-- Edit Action -->
										<a
											href={resolve(('/blood-groups?edit=' + group.uuid) as '/blood-groups')}
											class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
											title="Edit Blood Group"
										>
											<EditIcon class="size-4" />
										</a>

										<!-- Delete Action -->
										<form
											method="POST"
											action="?/delete"
											class="inline"
											onsubmit={confirmDelete}
											use:enhance={() => {
												isSubmitting = true;
												return async ({ result, update }) => {
													if (result.type === 'success') {
														successMessage = 'Blood group deleted successfully!';
														setTimeout(() => {
															successMessage = '';
														}, 3000);
													}
													await update();
													isSubmitting = false;
												};
											}}
										>
											<input type="hidden" name="uuid" value={group.uuid} />
											<Button
												type="submit"
												variant="ghost"
												size="icon-sm"
												class="text-destructive hover:text-destructive/80 size-8"
												title="Delete Blood Group"
												disabled={isSubmitting}
											>
												<TrashIcon class="size-4" />
											</Button>
										</form>
									</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</Card>

			<p class="text-xs text-muted-foreground">
				Showing {filteredGroups.length} of {totalGroups} entries
			</p>
		</div>

		<!-- Right: Form -->
		<Card>
			<CardHeader>
				<CardTitle>
					{#if editUuid}
						Edit Blood Group
					{:else}
						Add New Blood Group
					{/if}
				</CardTitle>
				<CardDescription>
					{#if editUuid}
						Update the blood group name.
					{:else}
						Create a new blood group entry in the system.
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action={editUuid ? '?/update' : '?/create'}
					class="space-y-4"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							if (result.type === 'success') {
								successMessage = editUuid
									? 'Blood group updated successfully!'
									: 'Blood group created successfully!';
								setTimeout(() => {
									successMessage = '';
								}, 3000);
								await update({ reset: true });
							} else {
								await update({ reset: false });
							}
							isSubmitting = false;
						};
					}}
				>
					{#if editUuid}
						<input type="hidden" name="uuid" value={editUuid} />
					{/if}

					<div class="space-y-2">
						<Label for="blood_group_name">Blood Group Name</Label>
						<Input
							id="blood_group_name"
							name="blood_group_name"
							bind:value={bloodGroupName}
							placeholder="e.g. AB+"
							required
						/>
					</div>

					{#if formError}
						<div transition:slide>
							<Alert variant="destructive">
								<AlertDescription>{formError}</AlertDescription>
							</Alert>
						</div>
					{/if}

					{#if successMessage}
						<div transition:slide>
							<Alert>
								<AlertDescription>{successMessage}</AlertDescription>
							</Alert>
						</div>
					{/if}

					<div class="space-y-2">
						<Button type="submit" class="w-full" disabled={isSubmitting}>
							{#if isSubmitting}
								<LoaderCircleIcon class="size-4 animate-spin" />
								Saving...
							{:else}
								{#if editUuid}
									Update Record
								{:else}
									Save Record
								{/if}
							{/if}
						</Button>

						{#if editUuid}
							<a
								href={resolve('/blood-groups')}
								class="inline-flex items-center justify-center w-full h-9 px-4 py-2 border border-input bg-transparent rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
							>
								Cancel Edit
							</a>
						{/if}
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
