<script lang="ts">
	interface Props {
		value: 'all' | 'active' | 'inactive';
		label?: string;
		onChange: (value: 'all' | 'active' | 'inactive') => void;
	}

	let { value, label = 'Filter by status', onChange }: Props = $props();
</script>

<select
	{value}
	aria-label={label}
	class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2652A]"
	onchange={(event) => onChange(event.currentTarget.value as 'all' | 'active' | 'inactive')}
>
	<option value="all">All</option>
	<option value="active">Active</option>
	<option value="inactive">Inactive</option>
</select>
