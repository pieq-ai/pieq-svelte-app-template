<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { type DateValue, getLocalTimeZone, parseDate, today } from "@internationalized/date";
	import { cn } from "$lib/utils.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Calendar } from "$lib/components/ui/calendar/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { untrack } from "svelte";

	interface Props {
		value?: string;
		placeholder?: string;
		class?: string;
		isError?: boolean;
		disabled?: boolean;
		id?: string;
		name?: string;
		min?: string;
		max?: string;
		required?: boolean;
		onchange?: () => void;
		isFilter?: boolean;
	}

	let { 
		value = $bindable(''), 
		placeholder = "DD/MM/YYYY", 
		class: className = "", 
		isError = $bindable(false), 
		disabled = false,
		id,
		name,
		min,
		max,
		required,
		onchange,
		isFilter = false
	}: Props = $props();

	let open = $state(false);
	let prevValue = $state(value);
	let prevTextValue = $state('');
	
	function formatDate(val: string): string {
		if (!val || val === 'Invalid Date') return '';
		try {
			const d = parseDate(val.split('T')[0]);
			const jsDate = d.toDate(getLocalTimeZone());
			const dd = String(jsDate.getDate()).padStart(2, '0');
			const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
			const yyyy = jsDate.getFullYear();
			return `${dd}/${mm}/${yyyy}`;
		} catch {
			return val; // If we can't parse it, just return the raw string (might be midway typing)
		}
	}

	let textValue = $state(formatDate(value));
	let calendarValue = $state<DateValue | undefined>(value && value !== 'Invalid Date' ? parseDate(value.split('T')[0]) : undefined);
	let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

	let minDate = $derived(min && min !== 'Invalid Date' ? parseDate(min.split('T')[0]) : undefined);
	let maxDate = $derived(max && max !== 'Invalid Date' ? parseDate(max.split('T')[0]) : undefined);

	const currentYear = new Date().getFullYear();
	const yearsForDropdown = Array.from({ length: currentYear - 1900 + 50 }, (_, i) => 1900 + i);

	$effect(() => {
		if (open && !calendarValue) {
			calendarPlaceholder = today(getLocalTimeZone());
		} else if (calendarValue) {
			calendarPlaceholder = calendarValue;
		}
	});

	$effect(() => {
		if (value !== prevValue) {
			untrack(() => {
				prevValue = value;
				if (value && value !== 'Invalid Date') {
					try {
						calendarValue = parseDate(value.split('T')[0]);
						textValue = formatDate(value);
						prevTextValue = textValue;
						isError = false;
					} catch {
						calendarValue = undefined;
						textValue = value;
						prevTextValue = textValue;
					}
				} else if (value === '') {
					calendarValue = undefined;
					textValue = '';
					prevTextValue = '';
					isError = false;
				}
			});
		}
	});

	$effect(() => {
		if (calendarValue) {
			const str = calendarValue.toString();
			if (str !== prevValue) {
				untrack(() => {
					prevValue = str;
					value = str;
					textValue = formatDate(str);
					prevTextValue = textValue;
					isError = false;
					open = false; 
					if (onchange) onchange();
				});
			}
		}
	});

	function handleToday() {
		const t = today(getLocalTimeZone());
		const tStr = t.toString();
		calendarValue = t;
		value = tStr;
		textValue = formatDate(tStr);
		prevTextValue = textValue;
		prevValue = tStr;
		isError = false;
		open = false;
		if (onchange) onchange();
	}

	function handleClear() {
		calendarValue = undefined;
		value = '';
		textValue = '';
		prevTextValue = '';
		prevValue = '';
		isError = false;
		open = false;
		if (onchange) onchange();
	}

	let isTodayDisabled = $derived.by(() => {
		const tStr = today(getLocalTimeZone()).toString();
		if (min && tStr < min) return true;
		if (max && tStr > max) return true;
		return false;
	});

	function parseInputDate(val: string): string | null {
		const cleanVal = val.replace(/-/g, '/').replace(/\./g, '/');
		const parts = cleanVal.split('/');
		if (parts.length === 3) {
			const day = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10);
			const year = parseInt(parts[2], 10);
			
			if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year >= 1000 && year <= 9999) {
				const dateObj = new Date(year, month - 1, day);
				if (dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day) {
					const mm = String(month).padStart(2, '0');
					const dd = String(day).padStart(2, '0');
					const yyyy = String(year).padStart(4, '0');
					return `${yyyy}-${mm}-${dd}`;
				}
			}
		}
		return null;
	}

	function autoFormatDate(val: string, oldVal: string) {
		if (val.length < oldVal.length) return val;

		let cleaned = val.replace(/[^\d/]/g, '');

		// Split by slash and pad any completed parts
		const parts = cleaned.split('/');
		if (parts.length > 1 && parts[0].length === 1) {
			parts[0] = '0' + parts[0];
		}
		if (parts.length > 2 && parts[1].length === 1) {
			parts[1] = '0' + parts[1];
		}
		cleaned = parts.join('/');

		if (/^\d{2}$/.test(cleaned)) {
			return cleaned + '/';
		}
		if (/^\d{2}\/\d{2}$/.test(cleaned)) {
			return cleaned + '/';
		}
		if (/^\d{8}$/.test(cleaned)) {
			return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
		}

		return cleaned;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let rawVal = target.value;
		
		const formatted = autoFormatDate(rawVal, prevTextValue);
		textValue = formatted;
		prevTextValue = formatted;
		
		if (textValue.trim() === '') {
			isError = false;
			calendarValue = undefined;
			value = '';
			prevValue = '';
			return;
		}

		const isoString = parseInputDate(textValue);
		if (isoString) {
			let isOutOfRange = false;
			if (min && isoString < min) isOutOfRange = true;
			if (max && isoString > max) isOutOfRange = true;

			if (!isOutOfRange) {
				try {
					calendarValue = parseDate(isoString);
					value = isoString;
					prevValue = isoString;
					isError = false;
					if (onchange) onchange();
				} catch {
					// Internal parse failure
				}
			} else {
				isError = true;
				value = '';
				prevValue = '';
				calendarValue = undefined;
				if (onchange) onchange();
			}
		}
	}
	
	function handleBlur() {
		if (textValue.trim() === '') {
			isError = false;
			value = '';
			prevValue = '';
			calendarValue = undefined;
			return;
		}
		
		const isoString = parseInputDate(textValue);
		if (!isoString) {
			isError = true;
			value = ''; // Clear value so required validation catches it
			prevValue = '';
			calendarValue = undefined;
			if (onchange) onchange();
		} else {
			let isOutOfRange = false;
			if (min && isoString < min) isOutOfRange = true;
			if (max && isoString > max) isOutOfRange = true;

			if (isOutOfRange) {
				isError = true;
				value = '';
				prevValue = '';
				calendarValue = undefined;
				if (onchange) onchange();
			} else {
				textValue = formatDate(isoString);
				prevTextValue = textValue;
			}
		}
	}
</script>

<div class="relative w-full group">
	{#if name}
		<input type="hidden" {name} {id} value={value ?? ''} />
	{/if}

	{#if isFilter}
		<Popover.Root bind:open>
			<Popover.Trigger>
				{#snippet child({ props })}
					<div 
						{...props} 
						class="relative w-full group cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-md outline-none"
					>
						<Input
							type="text"
							id={name ? undefined : id}
							{placeholder}
							{required}
							bind:value={textValue}
							readonly={true}
							{disabled}
							tabindex={-1}
							class={cn(
								"pr-10 transition-colors cursor-pointer select-none pointer-events-none",
								isError && "border-destructive focus-visible:ring-destructive/50",
								className
							)}
						/>
						<div class="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground">
							<CalendarIcon class="size-4 shrink-0" />
						</div>
					</div>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0 border border-border rounded-md shadow-md bg-popover z-50" align="end" sideOffset={4}>
				<Calendar 
					type="single" 
					bind:value={calendarValue} 
					bind:placeholder={calendarPlaceholder}
					minValue={minDate}
					maxValue={maxDate}
					captionLayout="dropdown"
					years={yearsForDropdown}
				/>
				<div class="flex items-center justify-between p-2 border-t border-border mt-1">
					<Button variant="ghost" size="sm" onclick={handleToday} disabled={isTodayDisabled}>Today</Button>
					<Button variant="ghost" size="sm" onclick={handleClear}>Clear</Button>
				</div>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Input
			type="text"
			id={name ? undefined : id}
			{placeholder}
			{required}
			bind:value={textValue}
			oninput={handleInput}
			onblur={handleBlur}
			{disabled}
			class={cn(
				"pr-10 transition-colors",
				isError && "border-destructive focus-visible:ring-destructive/50",
				className
			)}
		/>
		{#if !disabled}
			<Popover.Root bind:open>
				<Popover.Trigger class="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md">
					<CalendarIcon class="size-4 shrink-0" />
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0 border border-border rounded-md shadow-md bg-popover z-50" align="end" sideOffset={4}>
					<Calendar 
						type="single" 
						bind:value={calendarValue} 
						bind:placeholder={calendarPlaceholder}
						minValue={minDate}
						maxValue={maxDate}
						captionLayout="dropdown"
						years={yearsForDropdown}
					/>
					<div class="flex items-center justify-between p-2 border-t border-border mt-1">
						<Button variant="ghost" size="sm" onclick={handleToday} disabled={isTodayDisabled}>Today</Button>
						<Button variant="ghost" size="sm" onclick={handleClear}>Clear</Button>
					</div>
				</Popover.Content>
			</Popover.Root>
		{/if}
	{/if}
</div>
