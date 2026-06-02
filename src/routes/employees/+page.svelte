<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import {
		Alert,
		AlertDescription,
		Badge,
		Button,
		Input,
		Label
	} from '$lib/components';

	let employeesList = $state<Array<{ id: number; uuid: string; name: string; age: number }>>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let sortColumn = $state('id');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Filter
	let filterStatus = $state<'all' | 'active' | 'inactive'>('all');

	// Modal state
	let showAddModal = $state(false);
	let newName = $state('');
	let newAge = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	let filteredEmployees = $derived.by(() => {
		let result = [...employeesList];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(emp) =>
					emp.name.toLowerCase().includes(query) ||
					emp.uuid.toLowerCase().includes(query) ||
					emp.id.toString().includes(query)
			);
		}

		result.sort((a, b) => {
			const valA = a[sortColumn as keyof typeof a];
			const valB = b[sortColumn as keyof typeof b];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}

			return sortDirection === 'asc'
				? (valA as number) - (valB as number)
				: (valB as number) - (valA as number);
		});

		return result;
	});

	let totalEmployees = $derived(employeesList.length);
	let averageAge = $derived(
		totalEmployees > 0
			? Math.round(employeesList.reduce((acc, emp) => acc + emp.age, 0) / totalEmployees)
			: 0
	);
	let maxAge = $derived(totalEmployees > 0 ? Math.max(...employeesList.map((e) => e.age)) : 0);

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

	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function sortIndicator(column: string) {
		if (sortColumn !== column) return '';
		return sortDirection === 'asc' ? ' ↑' : ' ↓';
	}

	function openAddModal() {
		newName = '';
		newAge = '';
		errorMessage = '';
		successMessage = '';
		showAddModal = true;
	}

	function closeAddModal() {
		showAddModal = false;
		newName = '';
		newAge = '';
		errorMessage = '';
	}

	async function handleAddEmployee(e: Event) {
		e.preventDefault();
		const ageValue = Number(newAge);
		if (!newName.trim() || newAge === '' || newAge == null || isNaN(ageValue)) {
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
				body: JSON.stringify({ name: newName.trim(), age: ageValue })
			});

			const resData = await response.json();

			if (response.ok && resData.data) {
				employeesList = [resData.data, ...employeesList];
				closeAddModal();
				successMessage = 'Employee added successfully!';
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
	<title>Employees – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="page-topbar">
	<div>
		<span
			style="display:inline-block;background:#F453101a;color:#F45310;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>HRMS Module</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Employees
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Manage and monitor employee records with dynamic metrics.
		</p>
	</div>

	<button class="btn-add-entity" onclick={openAddModal} id="add-employee-btn">
		<PlusIcon size={16} />
		Add Employee
	</button>
</div>

<!-- Stats -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-card-label">Total Employees</div>
		<div class="stat-card-value">{totalEmployees}</div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Total registered enterprise employees</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Average Age</div>
		<div class="stat-card-value" style="color: #F45310">{averageAge}<span style="font-size:16px;font-weight:400;color:var(--muted-foreground)"> yrs</span></div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Mean age of workforce</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Max Registered Age</div>
		<div class="stat-card-value" style="color: #800020">{maxAge}<span style="font-size:16px;font-weight:400;color:var(--muted-foreground)"> yrs</span></div>
		<div style="font-size: 11px; color: var(--muted-foreground); margin-top: 6px;">Highest employee age recorded</div>
	</div>
</div>

<!-- Success toast -->
{#if successMessage}
	<div transition:slide style="margin-bottom:16px">
		<Alert>
			<AlertDescription>{successMessage}</AlertDescription>
		</Alert>
	</div>
{/if}

{#if loadError}
	<div style="margin-bottom:16px">
		<Alert variant="destructive">
			<AlertDescription>{loadError}</AlertDescription>
		</Alert>
	</div>
{/if}

<!-- Toolbar -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
	<!-- Search -->
	<div style="position:relative;flex:1;min-width:200px;max-width:340px">
		<span style="position:absolute;top:50%;left:10px;transform:translateY(-50%);color:var(--muted-foreground);display:flex">
			<SearchIcon size={15} />
		</span>
		<input
			type="search"
			placeholder="Search by name, ID or UUID..."
			bind:value={searchQuery}
			style="width:100%;border:1px solid var(--border);border-radius:8px;padding:8px 32px 8px 32px;font-size:13px;background:var(--card);color:var(--foreground);outline:none;box-sizing:border-box;transition:border-color .2s"
			onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#F45310')}
			onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
		/>
		{#if searchQuery}
			<button
				onclick={() => (searchQuery = '')}
				style="position:absolute;top:50%;right:8px;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted-foreground);display:flex;padding:2px"
				aria-label="Clear search"
			>
				<XIcon size={14} />
			</button>
		{/if}
	</div>

	<!-- Filter + count -->
	<div style="display:flex;align-items:center;gap:12px">
		<div style="display:flex;align-items:center;gap:6px">
			<span style="font-size:13px;color:var(--muted-foreground)">Filter:</span>
			<select bind:value={filterStatus} class="filter-select" id="employee-filter-select">
				<option value="all">All</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</select>
		</div>
		<p style="font-size:12px;color:var(--muted-foreground);white-space:nowrap">
			{filteredEmployees.length} of {totalEmployees}
		</p>
	</div>
</div>

<!-- Table card -->
<div class="enterprise-table-card">
	{#if isLoading}
		<div style="padding:64px;text-align:center;color:var(--muted-foreground);display:flex;align-items:center;justify-content:center;gap:10px">
			<LoaderCircleIcon class="animate-spin" size={18} />
			Loading employees...
		</div>
	{:else if filteredEmployees.length === 0}
		<div style="padding:64px;text-align:center">
			<span style="display:block;margin:0 auto 12px;color:var(--muted-foreground)">
				<UsersIcon size={32} />
			</span>
			<p style="color:var(--muted-foreground);font-size:14px">No employees match the criteria.</p>
		</div>
	{:else}
		<table style="width:100%;border-collapse:collapse">
			<thead style="background:var(--muted)">
				<tr>
					<th
						style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground);cursor:pointer;user-select:none"
						onclick={() => handleSort('id')}
					>#ID{sortIndicator('id')}</th>
					<th
						style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground);cursor:pointer;user-select:none"
						onclick={() => handleSort('name')}
					>Name{sortIndicator('name')}</th>
					<th
						style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground);cursor:pointer;user-select:none"
						onclick={() => handleSort('age')}
					>Age{sortIndicator('age')}</th>
					<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted-foreground)">UUID</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredEmployees as emp (emp.uuid)}
					<tr
						style="border-top:1px solid var(--border);transition:background .15s"
						onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
					>
						<td style="padding:13px 20px;font-size:13px;color:var(--muted-foreground);font-weight:500">#{emp.id}</td>
						<td style="padding:13px 20px;font-size:14px;font-weight:600;color:var(--foreground)">{emp.name}</td>
						<td style="padding:13px 20px">
							<span style="display:inline-flex;align-items:center;padding:2px 10px;background:#F4531018;color:#F45310;border-radius:99px;font-size:12px;font-weight:600">
								{emp.age} yrs
							</span>
						</td>
						<td style="padding:13px 20px;font-size:11px;font-family:monospace;color:var(--muted-foreground)">{emp.uuid}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<!-- Add Employee Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="modal-overlay"
		onclick={(e) => { if (e.target === e.currentTarget) closeAddModal(); }}
	>
		<div class="modal-card">
			<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
				<h2 style="font-size:18px;font-weight:700;margin:0">Add New Employee</h2>
				<button
					onclick={closeAddModal}
					style="background:none;border:none;cursor:pointer;color:var(--muted-foreground);padding:4px;border-radius:6px"
					aria-label="Close modal"
				>
					<XIcon size={18} />
				</button>
			</div>

			<form onsubmit={handleAddEmployee} style="display:flex;flex-direction:column;gap:16px">
				<div style="display:flex;flex-direction:column;gap:6px">
					<label for="emp-name" style="font-size:13px;font-weight:600">
						Full Name <span style="color:#F45310">*</span>
					</label>
					<input
						id="emp-name"
						type="text"
						bind:value={newName}
						placeholder="e.g. Charlie Brown"
						required
						style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
						onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#F45310')}
						onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
					/>
				</div>

				<div style="display:flex;flex-direction:column;gap:6px">
					<label for="emp-age" style="font-size:13px;font-weight:600">
						Age <span style="color:#F45310">*</span>
					</label>
					<input
						id="emp-age"
						type="number"
						bind:value={newAge}
						placeholder="e.g. 29"
						min="1"
						max="120"
						required
						style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--background);color:var(--foreground);outline:none;transition:border-color .2s;box-sizing:border-box"
						onfocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#F45310')}
						onblur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
					/>
				</div>

				{#if errorMessage}
					<div transition:slide>
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					</div>
				{/if}

				<div style="display:flex;justify-content:flex-end;gap:10px;padding-top:4px">
					<button
						type="submit"
						disabled={isSubmitting}
						style="padding:9px 18px;border-radius:8px;background:#F45310;color:white;border:none;font-size:13px;font-weight:600;cursor:pointer;opacity:{isSubmitting ? 0.7 : 1};display:inline-flex;align-items:center;gap:6px"
					>
						{#if isSubmitting}
							<LoaderCircleIcon class="animate-spin" size={14} />
						{/if}
						{isSubmitting ? 'Saving...' : 'Save Employee'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
