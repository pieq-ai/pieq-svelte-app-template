<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import ChevronsLeft from "@lucide/svelte/icons/chevrons-left";
	import ChevronsRight from "@lucide/svelte/icons/chevrons-right";
	import { cn } from "$lib/utils.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import type { DateValue } from "@internationalized/date";
	import { fade } from "svelte/transition";

	type Props = {
		value?: DateValue | undefined;
		placeholder?: DateValue | undefined;
		class?: string;
		weekdayFormat?: Intl.DateTimeFormatOptions["weekday"];
		onValueChange?: (value: DateValue | undefined) => void;
		[key: string]: any;
	};

	let {
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = "short",
		...restProps
	}: Props = $props();

	let viewState = $state<'day' | 'month' | 'year'>('day');

	const monthNames = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	// Day view helpers
	let currentMonthName = $derived(placeholder ? monthNames[placeholder.month - 1] : "");
	let currentYear = $derived(placeholder ? placeholder.year : 0);

	function prevYear() {
		if (placeholder) placeholder = placeholder.subtract({ years: 1 });
	}

	function prevMonth() {
		if (placeholder) placeholder = placeholder.subtract({ months: 1 });
	}

	function nextMonth() {
		if (placeholder) placeholder = placeholder.add({ months: 1 });
	}

	function nextYear() {
		if (placeholder) placeholder = placeholder.add({ years: 1 });
	}

	// Month view helpers
	function prev10Years() {
		if (placeholder) placeholder = placeholder.subtract({ years: 10 });
	}

	function next10Years() {
		if (placeholder) placeholder = placeholder.add({ years: 10 });
	}

	const monthsGrid = [
		{ value: 1, label: "Jan" },
		{ value: 2, label: "Feb" },
		{ value: 3, label: "Mar" },
		{ value: 4, label: "Apr" },
		{ value: 5, label: "May" },
		{ value: 6, label: "Jun" },
		{ value: 7, label: "Jul" },
		{ value: 8, label: "Aug" },
		{ value: 9, label: "Sep" },
		{ value: 10, label: "Oct" },
		{ value: 11, label: "Nov" },
		{ value: 12, label: "Dec" }
	];

	let isSelectedMonth = (monthVal: number) => {
		return value && value.year === currentYear && value.month === monthVal;
	};

	function selectMonth(monthVal: number) {
		if (placeholder) {
			placeholder = placeholder.set({ month: monthVal });
			viewState = 'day';
		}
	}

	// Year view helpers
	let startYear = $derived(placeholder ? placeholder.year - (placeholder.year % 12) : 2020);
	let endYear = $derived(startYear + 11);

	let yearsGrid = $derived.by(() => {
		const years = [];
		for (let y = startYear; y <= endYear; y++) {
			years.push(y);
		}
		return years;
	});

	let isSelectedYear = (yearVal: number) => {
		return value && value.year === yearVal;
	};

	function selectYear(yearVal: number) {
		if (placeholder) {
			placeholder = placeholder.set({ year: yearVal });
			viewState = 'month';
		}
	}

	function prevYearsRange() {
		if (placeholder) placeholder = placeholder.subtract({ years: 12 });
	}

	function nextYearsRange() {
		if (placeholder) placeholder = placeholder.add({ years: 12 });
	}
</script>

<CalendarPrimitive.Root
	type="single"
	bind:value
	bind:placeholder
	{weekdayFormat}
	class={cn("p-3 w-[280px] select-none", className)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		{#if viewState === 'day'}
			<div class="w-full" transition:fade={{ duration: 100 }}>
				<!-- Header -->
				<div class="relative flex items-center justify-between mb-4">
					<div class="flex items-center gap-0.5">
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={prevYear}
							aria-label="Previous year"
						>
							<ChevronsLeft class="size-4" />
						</Button>
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={prevMonth}
							aria-label="Previous month"
						>
							<ChevronLeft class="size-4" />
						</Button>
					</div>

					<Button
						variant="ghost"
						class="text-sm font-semibold text-[#262626] hover:bg-accent/60 rounded-md transition-colors px-2 py-1 h-7"
						onclick={() => viewState = 'month'}
					>
						{currentMonthName} {currentYear}
					</Button>

					<div class="flex items-center gap-0.5">
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={nextMonth}
							aria-label="Next month"
						>
							<ChevronRight class="size-4" />
						</Button>
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={nextYear}
							aria-label="Next year"
						>
							<ChevronsRight class="size-4" />
						</Button>
					</div>
				</div>

				<!-- Calendar Days Grid -->
				<div class="flex flex-col gap-y-4">
					{#each months as month}
						<CalendarPrimitive.Grid class="w-full border-collapse space-y-1">
							<CalendarPrimitive.GridHead>
								<CalendarPrimitive.GridRow class="flex">
									{#each weekdays as day}
										<CalendarPrimitive.HeadCell
											class="text-muted-foreground w-8 rounded-md text-[0.8rem] font-normal"
										>
											{day.slice(0, 2)}
										</CalendarPrimitive.HeadCell>
									{/each}
								</CalendarPrimitive.GridRow>
							</CalendarPrimitive.GridHead>
							<CalendarPrimitive.GridBody class="space-y-1">
								{#each month.weeks as weekDays}
									<CalendarPrimitive.GridRow class="flex w-full mt-2">
										{#each weekDays as date}
											<CalendarPrimitive.Cell
												{date}
												month={month.value}
												class={cn(
													"relative p-0 text-center text-sm focus-within:relative focus-within:z-20 has-data-selected:rounded-md has-data-selected:bg-accent",
													date.month !== month.value.month && "pointer-events-none opacity-20"
												)}
											>
												<CalendarPrimitive.Day
													class={cn(
														buttonVariants({ variant: "ghost" }),
														"h-8 w-8 p-0 font-normal aria-selected:opacity-100",
														"data-selected:bg-[#F45310] data-selected:text-white data-selected:hover:bg-[#F45310]/90 data-selected:font-semibold data-selected:hover:text-white",
														"data-today:bg-accent/30 data-today:text-accent-foreground data-today:ring-1 data-today:ring-[#F45310]/30",
														"data-outside-month:text-muted-foreground/30 data-outside-month:opacity-50",
														"data-disabled:text-muted-foreground data-disabled:opacity-30"
													)}
												/>
											</CalendarPrimitive.Cell>
										{/each}
									</CalendarPrimitive.GridRow>
								{/each}
							</CalendarPrimitive.GridBody>
						</CalendarPrimitive.Grid>
					{/each}
				</div>
			</div>
		{:else if viewState === 'month'}
			<div class="w-full" transition:fade={{ duration: 100 }}>
				<!-- Header -->
				<div class="relative flex items-center justify-between mb-4">
					<div class="flex items-center gap-0.5">
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={prev10Years}
							aria-label="Previous 10 years"
						>
							<ChevronsLeft class="size-4" />
						</Button>
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={prevYear}
							aria-label="Previous year"
						>
							<ChevronLeft class="size-4" />
						</Button>
					</div>

					<Button
						variant="ghost"
						class="text-sm font-semibold text-[#262626] hover:bg-accent/60 rounded-md transition-colors px-2 py-1 h-7"
						onclick={() => viewState = 'year'}
					>
						{currentYear}
					</Button>

					<div class="flex items-center gap-0.5">
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={nextYear}
							aria-label="Next year"
						>
							<ChevronRight class="size-4" />
						</Button>
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={next10Years}
							aria-label="Next 10 years"
						>
							<ChevronsRight class="size-4" />
						</Button>
					</div>
				</div>

				<!-- Months Grid -->
				<div class="grid grid-cols-4 gap-2 mt-4">
					{#each monthsGrid as mon}
						<Button
							variant="ghost"
							class={cn(
								"h-10 text-sm font-normal transition-colors rounded-md p-1",
								isSelectedMonth(mon.value)
									? "bg-[#F45310] text-white hover:bg-[#F45310]/90 font-semibold"
									: "hover:bg-accent hover:text-accent-foreground text-[#262626]"
							)}
							onclick={() => selectMonth(mon.value)}
						>
							{mon.label}
						</Button>
					{/each}
				</div>
			</div>
		{:else if viewState === 'year'}
			<div class="w-full" transition:fade={{ duration: 100 }}>
				<!-- Header -->
				<div class="relative flex items-center justify-between mb-4">
					<div class="flex items-center gap-0.5">
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={prevYearsRange}
							aria-label="Previous 12 years"
						>
							<ChevronsLeft class="size-4" />
						</Button>
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={prevYearsRange}
							aria-label="Previous 12 years"
						>
							<ChevronLeft class="size-4" />
						</Button>
					</div>

					<span class="text-sm font-semibold text-[#262626] px-2 py-1 h-7 flex items-center">
						{startYear} - {endYear}
					</span>

					<div class="flex items-center gap-0.5">
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={nextYearsRange}
							aria-label="Next 12 years"
						>
							<ChevronRight class="size-4" />
						</Button>
						<Button
							variant="outline"
							class="h-7 w-7 bg-transparent p-0 border border-border hover:bg-accent text-[#262626] rounded-md transition-colors"
							onclick={nextYearsRange}
							aria-label="Next 12 years"
						>
							<ChevronsRight class="size-4" />
						</Button>
					</div>
				</div>

				<!-- Years Grid -->
				<div class="grid grid-cols-4 gap-2 mt-4">
					{#each yearsGrid as yr}
						<Button
							variant="ghost"
							class={cn(
								"h-10 text-sm font-normal transition-colors rounded-md p-1",
								isSelectedYear(yr)
									? "bg-[#F45310] text-white hover:bg-[#F45310]/90 font-semibold"
									: "hover:bg-accent hover:text-accent-foreground text-[#262626]"
							)}
							onclick={() => selectYear(yr)}
						>
							{yr}
						</Button>
					{/each}
				</div>
			</div>
		{/if}
	{/snippet}
</CalendarPrimitive.Root>
