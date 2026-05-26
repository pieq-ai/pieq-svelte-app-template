<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let employeesList = $state<Array<{ id: number; uuid: string; name: string; age: number }>>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	// State variables for search, sort, and add-employee form
	let searchQuery = $state('');
	let sortColumn = $state('id');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Form states
	let newName = $state('');
	let newAge = $state<number | ''>('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Derived states using Svelte 5 runes
	let filteredEmployees = $derived.by(() => {
		let result = [...employeesList];

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(emp => 
				emp.name.toLowerCase().includes(query) ||
				emp.uuid.toLowerCase().includes(query) ||
				emp.id.toString().includes(query)
			);
		}

		// Apply sort
		result.sort((a, b) => {
			let valA = a[sortColumn as keyof typeof a];
			let valB = b[sortColumn as keyof typeof b];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDirection === 'asc' 
					? valA.localeCompare(valB) 
					: valB.localeCompare(valA);
			} else {
				// numbers or fallback
				return sortDirection === 'asc'
					? (valA as number) - (valB as number)
					: (valB as number) - (valA as number);
			}
		});

		return result;
	});

	// Dynamic stats calculations
	let totalEmployees = $derived(employeesList.length);
	let averageAge = $derived(
		totalEmployees > 0 
			? Math.round(employeesList.reduce((acc, emp) => acc + emp.age, 0) / totalEmployees) 
			: 0
	);
	let maxAge = $derived(
		totalEmployees > 0 
			? Math.max(...employeesList.map(e => e.age)) 
			: 0
	);

	async function loadEmployees() {
		isLoading = true;
		loadError = '';

		try {
			const response = await fetch('/api/employees');
			const resData = await response.json();

			if (response.ok) {
				employeesList = resData.data ?? [];
			} else {
				loadError = resData.error || 'Failed to load employees.';
			}
		} catch (err) {
			loadError = 'An error occurred while loading employees.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadEmployees();
	});

	// Toggle sort direction or change column
	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// Create employee via dynamic POST request to the backend API endpoint
	async function handleAddEmployee(e: Event) {
		e.preventDefault();
		if (!newName.trim() || newAge === '') {
			errorMessage = 'Please provide both Name and Age.';
			return;
		}

		errorMessage = '';
		successMessage = '';
		isSubmitting = true;

		try {
			const response = await fetch('/api/employees', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName, age: Number(newAge) })
			});

			const resData = await response.json();

			if (response.ok && resData.data) {
				// Prepend new employee dynamically
				employeesList = [resData.data, ...employeesList];
				newName = '';
				newAge = '';
				successMessage = 'Employee added successfully!';
				// Clear message after 3 seconds
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				errorMessage = resData.error || 'Failed to add employee.';
			}
		} catch (err) {
			errorMessage = 'An error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>System Employees Directory</title>
</svelte:head>

<div class="space-y-8 max-w-5xl mx-auto px-1 py-4">
	<!-- Header Section with sleek layout -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
		<div class="space-y-1">
			<span class="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">HRMS Module</span>
			<h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
				System Employees
			</h1>
			<p class="text-base text-slate-500">
				Manage and monitor authorized employee records with dynamic metrics and seamless creation.
			</p>
		</div>
	</div>

	<!-- Stats Summary Grid with rich aesthetics -->
	<div class="grid gap-6 sm:grid-cols-3">
		<div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200/80">
			<div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-50/50"></div>
			<div class="flex flex-col justify-between h-full relative z-10">
				<p class="text-sm font-semibold tracking-wide text-slate-500 uppercase">Total Active Employees</p>
				<p class="mt-4 text-4xl font-extrabold text-indigo-600 tracking-tight">{totalEmployees}</p>
				<span class="mt-2 text-xs text-slate-400">Total employees registered in the system</span>
			</div>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200/80">
			<div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50/50"></div>
			<div class="flex flex-col justify-between h-full relative z-10">
				<p class="text-sm font-semibold tracking-wide text-slate-500 uppercase">Average Employee Age</p>
				<p class="mt-4 text-4xl font-extrabold text-emerald-600 tracking-tight">{averageAge} <span class="text-lg font-medium text-slate-400">yrs</span></p>
				<span class="mt-2 text-xs text-slate-400">Calculated average of registered employees</span>
			</div>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200/80">
			<div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-50/50"></div>
			<div class="flex flex-col justify-between h-full relative z-10">
				<p class="text-sm font-semibold tracking-wide text-slate-500 uppercase">Max Registered Age</p>
				<p class="mt-4 text-4xl font-extrabold text-amber-600 tracking-tight">{maxAge} <span class="text-lg font-medium text-slate-400">yrs</span></p>
				<span class="mt-2 text-xs text-slate-400">Oldest active employee record</span>
			</div>
		</div>
	</div>

	<!-- Main Board: Employees Table + Form Interface -->
	<div class="grid gap-8 lg:grid-cols-3 items-start">
		
		<!-- Tabular List Column -->
		<div class="lg:col-span-2 space-y-4">
			{#if loadError}
				<div class="bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-xl font-semibold border border-rose-100">
					{loadError}
				</div>
			{/if}

			<!-- Toolbar: Search input -->
			<div class="flex items-center gap-3">
				<div class="relative flex-grow">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input 
						type="text" 
						placeholder="Search by name, ID or UUID..." 
						bind:value={searchQuery}
						class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-sm"
					/>
					{#if searchQuery}
						<button 
							onclick={() => searchQuery = ''}
							aria-label="Clear search"
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			</div>

			<!-- Dynamic Responsive Table -->
			<div class="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-slate-100">
						<thead class="bg-slate-50/70">
							<tr>
								<th scope="col" class="py-3.5 pl-6 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-indigo-600 transition-colors" onclick={() => handleSort('id')}>
									<div class="flex items-center gap-1.5">
										ID
										{#if sortColumn === 'id'}
											<span class="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</div>
								</th>
								<th scope="col" class="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-indigo-600 transition-colors" onclick={() => handleSort('name')}>
									<div class="flex items-center gap-1.5">
										Name
										{#if sortColumn === 'name'}
											<span class="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</div>
								</th>
								<th scope="col" class="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-indigo-600 transition-colors" onclick={() => handleSort('age')}>
									<div class="flex items-center gap-1.5">
										Age
										{#if sortColumn === 'age'}
											<span class="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
										{/if}
									</div>
								</th>
								<th scope="col" class="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
									UUID
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 bg-white">
							{#if isLoading}
								<tr>
									<td colspan="4" class="py-12 text-center text-sm text-slate-400 font-medium">
										Loading employees...
									</td>
								</tr>
							{:else}
							{#each filteredEmployees as emp (emp.uuid)}
								<tr class="transition-colors hover:bg-slate-50/50 group">
									<td class="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-semibold text-slate-700">
										#{emp.id}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm font-bold text-slate-900">
										{emp.name}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
										<span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
											{emp.age} yrs old
										</span>
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-xs font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
										{emp.uuid}
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="4" class="py-12 text-center text-sm text-slate-400 font-medium">
										<div class="flex flex-col items-center justify-center gap-2">
											<svg class="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
											</svg>
											<span>No employees match the criteria.</span>
										</div>
									</td>
								</tr>
							{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
			
			<div class="flex justify-between items-center text-xs text-slate-400 px-2">
				<span>Showing {filteredEmployees.length} of {totalEmployees} entries</span>
				<span>Reactive real-time client-state filters active</span>
			</div>
		</div>

		<!-- Dynamic Create Employee Column (Form Card) -->
		<div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
			<div class="border-b border-slate-100 pb-3">
				<h2 class="text-lg font-bold text-slate-900">Add New Employee</h2>
				<p class="text-xs text-slate-400">Instantly persist a new employee record in PostgreSQL via API endpoint.</p>
			</div>

			<form onsubmit={handleAddEmployee} class="space-y-4">
				<div>
					<label for="name" class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
					<input 
						id="name"
						type="text" 
						placeholder="e.g. Charlie Brown" 
						bind:value={newName}
						required
						class="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-sm"
					/>
				</div>

				<div>
					<label for="age" class="block text-xs font-bold text-slate-500 uppercase tracking-wide">Age</label>
					<input 
						id="age"
						type="number" 
						placeholder="e.g. 29" 
						bind:value={newAge}
						min="1"
						max="120"
						required
						class="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-sm"
					/>
				</div>

				{#if errorMessage}
					<div transition:slide class="bg-rose-50 text-rose-600 text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 border border-rose-100">
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						{errorMessage}
					</div>
				{/if}

				{#if successMessage}
					<div transition:slide class="bg-emerald-50 text-emerald-600 text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 border border-emerald-100">
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{successMessage}
					</div>
				{/if}

				<button 
					type="submit" 
					disabled={isSubmitting}
					class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Saving Employee...
					{:else}
						Save Employee Record
					{/if}
				</button>
			</form>
		</div>

	</div>
</div>
