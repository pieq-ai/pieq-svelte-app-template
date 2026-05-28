<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { Button, Input, Label } from '$lib/components';
	import type { MasterPermissionConfig } from '$lib/permissions/mock-permissions';

	export interface DropdownOption {
		id: string;
		label: string;
	}

	interface Props {
		label: string;
		options: DropdownOption[];
		value: string;
		placeholder?: string;
		permissions?: Partial<MasterPermissionConfig>;
		onSelect: (id: string) => void;
		onAdd?: () => void;
		onEdit?: (id: string) => void;
	}

	let {
		label,
		options,
		value,
		placeholder = 'Search or select...',
		permissions = {},
		onSelect,
		onAdd,
		onEdit
	}: Props = $props();

	let query = $state('');

	let filteredOptions = $derived.by(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return options;
		return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
	});
</script>

<div class="space-y-2">
	<Label>{label}</Label>
	<div class="relative">
		<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		<Input bind:value={query} class="pl-9" placeholder={placeholder} />
	</div>
	<div class="max-h-56 overflow-y-auto rounded-md border border-border">
		{#each filteredOptions as option (option.id)}
			<div class="flex items-center justify-between border-b border-border px-3 py-2 last:border-b-0">
				<button
					type="button"
					class={`min-w-0 flex-1 truncate text-left text-sm ${value === option.id ? 'font-semibold text-[#C2652A]' : 'text-foreground'}`}
					onclick={() => onSelect(option.id)}
				>
					{option.label}
				</button>
				{#if permissions.canEdit && onEdit}
					<Button type="button" variant="ghost" size="icon-xs" aria-label={`Edit ${option.label}`} onclick={() => onEdit(option.id)}>
						<PencilIcon class="size-3" />
					</Button>
				{/if}
			</div>
		{:else}
			<p class="px-3 py-4 text-sm text-muted-foreground">No options found.</p>
		{/each}
	</div>
	{#if permissions.canCreate && onAdd}
		<Button type="button" variant="outline" size="sm" class="w-full" onclick={onAdd}>
			<PlusIcon class="size-4" />
			Add option
		</Button>
	{/if}
</div>
