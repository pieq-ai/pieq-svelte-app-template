<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover/index.js";
	import { Calendar } from "$lib/components/ui/calendar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { parseDate, type DateValue } from "@internationalized/date";
	import { cn } from "$lib/utils.js";

	interface Props {
		id?: string;
		name?: string;
		value: string | null; // format YYYY-MM-DD
		onChange: (value: string | null) => void;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		isDateDisabled?: (date: DateValue) => boolean;
	}

	let {
		id,
		name,
		value = $bindable(),
		onChange,
		placeholder = "Select date...",
		class: className,
		disabled = false,
		isDateDisabled
	}: Props = $props();

	let open = $state(false);

	// Parse string YYYY-MM-DD to DateValue
	let calendarValue = $state<DateValue | undefined>(undefined);

	// Sync value -> calendarValue
	$effect(() => {
		if (value) {
			try {
				calendarValue = parseDate(value);
			} catch {
				calendarValue = undefined;
			}
		} else {
			calendarValue = undefined;
		}
	});

	function handleSelect(date: DateValue | undefined) {
		calendarValue = date;
		const newValue = date ? date.toString() : null;
		value = newValue;
		onChange(newValue);
		open = false;
	}

	// Helper to display date nicely in DD/MM/YYYY format
	let displayValue = $derived.by(() => {
		if (!calendarValue) return placeholder;
		const d = String(calendarValue.day).padStart(2, '0');
		const m = String(calendarValue.month).padStart(2, '0');
		const y = calendarValue.year;
		return `${d}/${m}/${y}`;
	});
</script>

<input type="hidden" {id} {name} {value} />

<Popover bind:open>
	<PopoverTrigger disabled={disabled}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(
					"h-10 w-full justify-between border border-input bg-background px-3 py-2 text-sm text-[#262626] font-normal shadow-xs transition-all duration-200 focus:border-[#F45310] focus:ring-2 focus:ring-[#F45310]/20 focus-visible:border-[#F45310] focus-visible:ring-2 focus-visible:ring-[#F45310]/20 outline-none rounded-lg text-left",
					!value && "text-muted-foreground",
					className
				)}
				{...props}
			>
				<span>{displayValue}</span>
				<CalendarIcon class="ml-auto size-5 text-muted-foreground opacity-70" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0" align="start" sideOffset={4}>
		<Calendar value={calendarValue} onValueChange={handleSelect} {isDateDisabled} initialFocus />
	</PopoverContent>
</Popover>
