<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> = $props();

	let open = $state(false);
	let selectElement = $state<HTMLSelectElement | null>(null);

	function handleSelect(newYear: number) {
		if (selectElement) {
			selectElement.value = newYear.toString();
			selectElement.dispatchEvent(new Event('change', { bubbles: true }));
			open = false;
		}
	}

	function scrollToActive(node: HTMLElement, active: boolean) {
		if (active) {
			setTimeout(() => node.scrollIntoView({ block: 'center' }), 0);
		}
		return {
			update(newActive: boolean) {
				if (newActive) setTimeout(() => node.scrollIntoView({ block: 'center' }), 0);
			}
		};
	}
</script>

<CalendarPrimitive.YearSelect bind:ref {...restProps}>
	{#snippet child({ props, yearItems, selectedYearItem })}
		<select {...props} {value} bind:this={selectElement} class="hidden">
			{#each yearItems as yearItem (yearItem.value)}
				<option
					value={yearItem.value}
					selected={value !== undefined
						? yearItem.value === value
						: yearItem.value === selectedYearItem.value}
				>
					{yearItem.label}
				</option>
			{/each}
		</select>
		<Popover.Root bind:open>
			<Popover.Trigger class={cn("flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none transition-colors", className)}>
				{yearItems.find((item) => item.value === value)?.label || selectedYearItem.label}
				<ChevronDownIcon class="size-4 opacity-50 shrink-0" />
			</Popover.Trigger>
			<Popover.Content class="w-[120px] p-0 border border-border rounded-md shadow-md bg-popover text-popover-foreground z-100" align="start">
				<ScrollArea class="h-64">
					<div class="p-1 flex flex-col gap-0.5">
						{#each yearItems as yearItem (yearItem.value)}
							<button
								type="button"
								use:scrollToActive={yearItem.value === value}
								class={cn(
									"flex w-full items-center justify-start rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors text-left",
									yearItem.value === value && "bg-accent text-accent-foreground font-medium"
								)}
								onclick={() => handleSelect(yearItem.value)}
							>
								{yearItem.label}
							</button>
						{/each}
					</div>
				</ScrollArea>
			</Popover.Content>
		</Popover.Root>
	{/snippet}
</CalendarPrimitive.YearSelect>
