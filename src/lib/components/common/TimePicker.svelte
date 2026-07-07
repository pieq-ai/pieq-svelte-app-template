<script lang="ts">
	import ClockIcon from "@lucide/svelte/icons/clock";
	import { cn } from "$lib/utils.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { untrack } from "svelte";

	interface Props {
		value?: string | null;
		placeholder?: string;
		class?: string;
		isError?: boolean;
		disabled?: boolean;
		id?: string;
		name?: string;
		required?: boolean;
		onchange?: () => void;
	}

	let { 
		value = $bindable(''), 
		placeholder = "HH:MM AM/PM", 
		class: className = "", 
		isError = $bindable(false), 
		disabled = false,
		id,
		name,
		required,
		onchange
	}: Props = $props();

	let open = $state(false);
	let prevValue = $state(value);
	let prevTextValue = $state('');

	function to12h(val: string | null | undefined): string {
		if (!val) return '';
		const match = val.match(/(\d{2}):(\d{2})/);
		if (match) {
			let hours = parseInt(match[1], 10);
			const minutes = match[2];
			const ampm = hours >= 12 ? 'PM' : 'AM';
			hours = hours % 12;
			hours = hours ? hours : 12; // 0 is 12
			const hoursStr = String(hours).padStart(2, '0');
			return `${hoursStr}:${minutes} ${ampm}`;
		}
		return val;
	}

	function to24h(val: string | null | undefined): string | null {
		if (!val) return null;
		// 1. Try parsing "HH:MM AM/PM" or "H:MM AM/PM"
		const match12 = val.match(/^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$/);
		if (match12) {
			let hours = parseInt(match12[1], 10);
			const minutes = parseInt(match12[2], 10);
			const ampm = match12[3].toUpperCase();
			if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
			if (ampm === 'PM' && hours < 12) {
				hours += 12;
			} else if (ampm === 'AM' && hours === 12) {
				hours = 0;
			}
			const hh = String(hours).padStart(2, '0');
			const mm = String(minutes).padStart(2, '0');
			return `${hh}:${mm}`;
		}
		
		// 2. Try parsing "HH:MM" (24h fallback if they type it directly)
		const match24 = val.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
		if (match24) {
			const hours = parseInt(match24[1], 10);
			const minutes = parseInt(match24[2], 10);
			if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
				const hh = String(hours).padStart(2, '0');
				const mm = String(minutes).padStart(2, '0');
				return `${hh}:${mm}`;
			}
		}
		return null;
	}

	let textValue = $state(to12h(value));
	let selectedHour12 = $state<number | null>(null);
	let selectedMinute = $state<number | null>(null);
	let selectedAmPm = $state<'AM' | 'PM'>('AM');

	// Sync state when open changes
	$effect(() => {
		if (open) {
			const parsed24 = to24h(textValue) || value;
			if (parsed24) {
				const match = parsed24.match(/(\d{2}):(\d{2})/);
				if (match) {
					const h24 = Number(match[1]);
					selectedMinute = Number(match[2]);
					selectedAmPm = h24 >= 12 ? 'PM' : 'AM';
					const h12 = h24 % 12;
					selectedHour12 = h12 ? h12 : 12;
				}
			} else {
				selectedHour12 = null;
				selectedMinute = null;
				selectedAmPm = 'AM';
			}
		}
	});

	$effect(() => {
		if (value !== prevValue) {
			untrack(() => {
				prevValue = value;
				const formatted = to12h(value);
				textValue = formatted;
				prevTextValue = formatted;
				isError = false;
			});
		}
	});

	function handleClear() {
		selectedHour12 = null;
		selectedMinute = null;
		selectedAmPm = 'AM';
		value = '';
		textValue = '';
		prevTextValue = '';
		prevValue = '';
		isError = false;
		open = false;
		if (onchange) onchange();
	}

	function handleSetTime() {
		let h12 = selectedHour12 !== null ? selectedHour12 : 12;
		let m = selectedMinute !== null ? selectedMinute : 0;
		let ampm = selectedAmPm;
		
		let h24 = h12;
		if (ampm === 'PM' && h12 < 12) {
			h24 += 12;
		} else if (ampm === 'AM' && h12 === 12) {
			h24 = 0;
		}
		
		const hh = String(h24).padStart(2, '0');
		const mm = String(m).padStart(2, '0');
		const time24 = `${hh}:${mm}`;
		
		value = time24;
		textValue = to12h(time24);
		prevTextValue = textValue;
		prevValue = time24;
		isError = false;
		open = false;
		if (onchange) onchange();
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let rawVal = target.value;
		
		textValue = rawVal;
		prevTextValue = rawVal;
		
		if (textValue.trim() === '') {
			isError = false;
			value = '';
			prevValue = '';
			return;
		}

		const cleanTime = to24h(textValue);
		if (cleanTime) {
			value = cleanTime;
			prevValue = cleanTime;
			isError = false;
			if (onchange) onchange();
		}
	}
	
	function handleBlur() {
		if (textValue.trim() === '') {
			isError = false;
			value = '';
			prevValue = '';
			return;
		}
		
		const cleanTime = to24h(textValue);
		if (!cleanTime) {
			isError = true;
			value = '';
			prevValue = '';
			if (onchange) onchange();
		} else {
			textValue = to12h(cleanTime);
			prevTextValue = textValue;
		}
	}
</script>

<div class="relative w-full group">
	{#if name}
		<input type="hidden" {name} {id} value={value ?? ''} />
	{/if}

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
				<ClockIcon class="size-4 shrink-0" />
			</Popover.Trigger>
			<Popover.Content class="w-64 p-0 border border-border rounded-md shadow-md bg-popover z-50 flex flex-col" align="end" sideOffset={4}>
				<div class="p-3 text-sm font-semibold text-center border-b border-border flex justify-between items-center bg-muted/30">
					<span>Select Time</span>
					<span class="text-[#F45310] font-mono">
						{selectedHour12 !== null ? String(selectedHour12).padStart(2, '0') : '--'}:{selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : '--'} {selectedAmPm}
					</span>
				</div>
				<div class="flex h-48">
					<!-- Hour column -->
					<div class="w-1/3 overflow-y-auto border-r border-border flex flex-col scrollbar-thin">
						<div class="text-xs text-muted-foreground text-center py-1 sticky top-0 bg-popover border-b border-border">Hrs</div>
						{#each Array.from({length: 12}) as _, i}
							{@const h = i + 1}
							<button
								type="button"
								onclick={() => { selectedHour12 = h; }}
								class={cn(
									"py-1.5 px-3 text-sm text-center hover:bg-accent hover:text-accent-foreground font-mono focus:outline-none transition-colors",
									selectedHour12 === h && "bg-[#F45310] text-white hover:bg-[#F45310] hover:text-white font-bold"
								)}
							>
								{String(h).padStart(2, '0')}
							</button>
						{/each}
					</div>
					<!-- Minute column -->
					<div class="w-1/3 overflow-y-auto border-r border-border flex flex-col scrollbar-thin">
						<div class="text-xs text-muted-foreground text-center py-1 sticky top-0 bg-popover border-b border-border">Mins</div>
						{#each Array.from({length: 60}) as _, m}
							<button
								type="button"
								onclick={() => { selectedMinute = m; }}
								class={cn(
									"py-1.5 px-3 text-sm text-center hover:bg-accent hover:text-accent-foreground font-mono focus:outline-none transition-colors",
									selectedMinute === m && "bg-[#F45310] text-white hover:bg-[#F45310] hover:text-white font-bold"
								)}
							>
								{String(m).padStart(2, '0')}
							</button>
						{/each}
					</div>
					<!-- AM/PM column -->
					<div class="w-1/3 flex flex-col justify-center gap-2 p-2">
						<button
							type="button"
							onclick={() => { selectedAmPm = 'AM'; }}
							class={cn(
								"py-2 px-3 text-xs font-bold text-center border rounded-md hover:bg-accent focus:outline-none transition-colors",
								selectedAmPm === 'AM' && "bg-[#F45310] border-[#F45310] text-white hover:bg-[#F45310] hover:text-white"
							)}
						>
							AM
						</button>
						<button
							type="button"
							onclick={() => { selectedAmPm = 'PM'; }}
							class={cn(
								"py-2 px-3 text-xs font-bold text-center border rounded-md hover:bg-accent focus:outline-none transition-colors",
								selectedAmPm === 'PM' && "bg-[#F45310] border-[#F45310] text-white hover:bg-[#F45310] hover:text-white"
							)}
						>
							PM
						</button>
					</div>
				</div>
				<div class="flex items-center justify-between p-2 border-t border-border bg-muted/20">
					<Button variant="ghost" size="sm" onclick={handleClear}>Clear</Button>
					<Button variant="default" size="sm" class="bg-[#F45310] hover:bg-[#F45310]/90 text-white" onclick={handleSetTime}>OK</Button>
				</div>
			</Popover.Content>
		</Popover.Root>
	{/if}
</div>
