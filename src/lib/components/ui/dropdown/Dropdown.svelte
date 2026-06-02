<script lang="ts">
	import { cn } from "$lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		value = $bindable(),
		options = [],
		placeholder = "Select option",
		id = "",
		name = "",
		required = false,
		disabled = false,
		class: className = "",
		isFilter = false,
		hasError = false,
		onchange
	}: {
		value: any;
		options: { value: any; label: string }[];
		placeholder?: string;
		id?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		isFilter?: boolean;
		hasError?: boolean;
		onchange?: (val: any) => void;
	} = $props();

	let isOpen = $state(false);
	let containerRef = $state<HTMLDivElement | null>(null);

	let selectedLabel = $derived.by(() => {
		const found = options.find(opt => String(opt.value) === String(value));
		return found ? found.label : placeholder;
	});

	function toggle() {
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	function selectOption(optValue: any) {
		value = optValue;
		isOpen = false;
		if (onchange) {
			onchange(optValue);
		}
	}

	$effect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
				isOpen = false;
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	});
</script>

<div
	bind:this={containerRef}
	class={cn("relative inline-block w-full text-left", className)}
>
	<!-- Hidden input for form submission if name is provided -->
	{#if name}
		<input type="hidden" {name} {id} value={value ?? ''} {required} />
	{/if}

	<button
		type="button"
		{disabled}
		onclick={toggle}
		class={cn(
			"flex items-center justify-between w-full h-9 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs transition-colors hover:bg-accent/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none cursor-pointer",
			isOpen && "ring-2 ring-ring ring-offset-2",
			hasError && "border-destructive focus-visible:ring-destructive"
		)}
	>
		<span class="truncate">{selectedLabel}</span>
		<span class="ml-2 flex items-center shrink-0 text-muted-foreground">
			{#if isFilter}
				<FilterIcon class="size-4" />
			{:else}
				<ChevronDownIcon class="size-4" />
			{/if}
		</span>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 z-50 mt-1 w-full min-w-[120px] origin-top-right rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-hidden py-1 max-h-60 overflow-y-auto"
			role="menu"
		>
			{#each options as option}
				{@const isSelected = String(option.value) === String(value)}
				<button
					type="button"
					onclick={() => selectOption(option.value)}
					class={cn(
						"flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-[#F4F4F4] transition-colors cursor-pointer select-none",
						isSelected && "bg-[#F4F4F4]/50 font-medium"
					)}
					role="menuitem"
				>
					<span class="truncate">{option.label}</span>
					{#if isSelected}
						<CheckIcon class="size-4 shrink-0 text-foreground ml-2" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
