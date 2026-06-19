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
		onchange,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.MonthSelectProps> = $props();

	let open = $state(false);
	let selectElement = $state<HTMLSelectElement | null>(null);

	function handleSelect(newMonth: number) {
		if (selectElement) {
			selectElement.value = newMonth.toString();
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

<CalendarPrimitive.MonthSelect bind:ref {...restProps}>
	{#snippet child({ props, monthItems, selectedMonthItem })}
		<select {...props} {value} {onchange} bind:this={selectElement} class="hidden">
			{#each monthItems as monthItem (monthItem.value)}
				<option
					value={monthItem.value}
					selected={value !== undefined
						? monthItem.value === value
						: monthItem.value === selectedMonthItem.value}
				>
					{monthItem.label}
				</option>
			{/each}
		</select>
		<Popover.Root bind:open>
			<Popover.Trigger class={cn("flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none transition-colors", className)}>
				{monthItems.find((item) => item.value === value)?.label || selectedMonthItem.label}
				<ChevronDownIcon class="size-4 opacity-50 shrink-0" />
			</Popover.Trigger>
			<Popover.Content class="w-[140px] p-0 border border-border rounded-md shadow-md bg-popover text-popover-foreground z-100" align="start">
				<ScrollArea class="h-64">
					<div class="p-1 flex flex-col gap-0.5">
						{#each monthItems as monthItem (monthItem.value)}
							<button
								type="button"
								use:scrollToActive={monthItem.value === value}
								class={cn(
									"flex w-full items-center justify-start rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors text-left",
									monthItem.value === value && "bg-accent text-accent-foreground font-medium"
								)}
								onclick={() => handleSelect(monthItem.value)}
							>
								{monthItem.label}
							</button>
						{/each}
					</div>
				</ScrollArea>
			</Popover.Content>
		</Popover.Root>
	{/snippet}
</CalendarPrimitive.MonthSelect>
