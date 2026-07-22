<script lang="ts">
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import {
		Badge,
		Button,
		Card,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		Pagination,
		TableActions
	} from '$lib/components';
	import { UI_CONSTANTS } from '$lib/constants';
	import AuditStatusBadge from './AuditStatusBadge.svelte';

	interface AuditLog {
		cuid: string;
		entity_name: string;
		entity_cuid: string;
		action_type: string;
		status: string;
		field_name: string | null;
		performed_by: string | null;
		created_at: string;
	}

	interface Props {
		logs: AuditLog[];
		total: number;
		currentPage: number;
		pageSize: number;
		onRowClick: (cuid: string) => void;
	}

	let {
		logs,
		total,
		currentPage = $bindable(),
		pageSize,
		onRowClick
	}: Props = $props();

	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	function handleSort(column: string) {
		if (sortColumn === column) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else if (sortDirection === 'desc') {
				sortColumn = null;
				sortDirection = null;
			} else {
				sortDirection = 'asc';
			}
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	let sortedLogs = $derived.by(() => {
		if (!sortColumn || !sortDirection) return logs;
		return [...logs].sort((a, b) => {
			const valA = a[sortColumn as keyof AuditLog];
			const valB = b[sortColumn as keyof AuditLog];

			if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
			if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

			if (sortColumn === 'created_at') {
				const timeA = new Date(valA as string).getTime();
				const timeB = new Date(valB as string).getTime();
				return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
			}

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}

			return 0;
		});
	});

	let paginatedLogs = $derived(
		sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	function isInteractive(target: HTMLElement | null, rowElement: HTMLElement): boolean {
		let curr = target;
		while (curr && curr !== rowElement) {
			const tagName = curr.tagName.toLowerCase();
			if (
				tagName === 'a' ||
				tagName === 'button' ||
				tagName === 'input' ||
				tagName === 'select' ||
				tagName === 'textarea' ||
				curr.getAttribute('role') === 'button'
			) {
				return true;
			}
			curr = curr.parentElement;
		}
		return false;
	}

	function onTableClick(cuid: string, event: MouseEvent) {
		const target = event.target as HTMLElement;
		const row = event.currentTarget as HTMLElement;
		if (isInteractive(target, row)) return;
		onRowClick(cuid);
	}
</script>

<Card class="py-0 overflow-x-auto">
	<Table>
		<TableHeader class="bg-muted">
			<TableRow>
				<TableHead class="font-bold text-foreground text-[15px]">
					<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('created_at')}>
						Timestamp
						{#if sortColumn === 'created_at' && sortDirection === 'asc'}
							<ArrowUpIcon class="ml-2 size-4" />
						{:else if sortColumn === 'created_at' && sortDirection === 'desc'}
							<ArrowDownIcon class="ml-2 size-4" />
						{:else}
							<ArrowUpDownIcon class="ml-2 size-4" />
						{/if}
					</Button>
				</TableHead>
				<TableHead class="font-bold text-foreground text-[15px]">
					<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('entity_name')}>
						Entity
						{#if sortColumn === 'entity_name' && sortDirection === 'asc'}
							<ArrowUpIcon class="ml-2 size-4" />
						{:else if sortColumn === 'entity_name' && sortDirection === 'desc'}
							<ArrowDownIcon class="ml-2 size-4" />
						{:else}
							<ArrowUpDownIcon class="ml-2 size-4" />
						{/if}
					</Button>
				</TableHead>
				<TableHead class="font-bold text-foreground text-[15px]">Entity CUID</TableHead>
				<TableHead class="font-bold text-foreground text-[15px]">Action</TableHead>
				<TableHead class="font-bold text-foreground text-[15px]">Status</TableHead>
				<TableHead class="font-bold text-foreground text-[15px]">
					<Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => handleSort('performed_by')}>
						Updated By
						{#if sortColumn === 'performed_by' && sortDirection === 'asc'}
							<ArrowUpIcon class="ml-2 size-4" />
						{:else if sortColumn === 'performed_by' && sortDirection === 'desc'}
							<ArrowDownIcon class="ml-2 size-4" />
						{:else}
							<ArrowUpDownIcon class="ml-2 size-4" />
						{/if}
					</Button>
				</TableHead>
				<TableHead class="font-bold text-foreground text-[15px]">Field</TableHead>
				<TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if logs.length === 0}
				<TableRow>
					<TableCell colspan={8} class="py-8 text-center text-muted-foreground">
						{UI_CONSTANTS.EMPTY_STATE_MESSAGE}
					</TableCell>
				</TableRow>
			{:else}
				{#each paginatedLogs as log (log.cuid)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<TableRow onclick={(e) => onTableClick(log.cuid, e)} class="cursor-pointer hover:bg-muted/50">
						<TableCell class="font-medium text-xs whitespace-nowrap">
							{new Date(log.created_at).toLocaleString()}
						</TableCell>
						<TableCell class="font-semibold">{log.entity_name}</TableCell>
						<TableCell class="font-mono text-[11px] max-w-[120px] truncate" title={log.entity_cuid}>
							{log.entity_cuid}
						</TableCell>
						<TableCell class="capitalize">
							<Badge variant="outline" class="font-mono font-medium text-[10px] uppercase">
								{log.action_type}
							</Badge>
						</TableCell>
						<TableCell>
							<AuditStatusBadge status={log.status} />
						</TableCell>
						<TableCell class="font-mono text-xs max-w-[160px] truncate" title={log.performed_by || '-'}>
							{log.performed_by || '-'}
						</TableCell>
						<TableCell class="font-mono text-[11px] max-w-[120px] truncate">
							{log.field_name || '-'}
						</TableCell>
						<TableCell class="text-right">
							<TableActions
								canView={true}
								viewLabel="View Details"
								onView={() => onRowClick(log.cuid)}
							/>
						</TableCell>
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>
</Card>

<Pagination
	bind:currentPage={currentPage}
	pageSize={pageSize}
	totalItems={logs.length}
/>
