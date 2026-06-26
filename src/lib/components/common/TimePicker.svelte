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
		placeholder = "HH:MM", 
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

	function formatTime(val: string | null | undefined): string {
		if (!val) return '';
		// Extract HH:MM if it has seconds (HH:MM:SS) or date prefix
		const match = val.match(/(\d{2}):(\d{2})/);
		if (match) {
			return `${match[1]}:${match[2]}`;
		}
		return val;
	}

	let textValue = $state(formatTime(value));
	let selectedHour = $state<number | null>(null);
	let selectedMinute = $state<number | null>(null);

	// Sync state when open changes
	$effect(() => {
		if (open) {
			const parsed = parseInputTime(textValue);
			if (parsed) {
				const [h, m] = parsed.split(':').map(Number);
				selectedHour = h;
				selectedMinute = m;
			} else {
				selectedHour = null;
				selectedMinute = null;
			}
		}
	});

	$effect(() => {
		if (value !== prevValue) {
			untrack(() => {
				prevValue = value;
				const formatted = formatTime(value);
				textValue = formatted;
				prevTextValue = formatted;
				isError = false;
			});
		}
	});

	function handleClear() {
		selectedHour = null;
		selectedMinute = null;
		value = '';
		textValue = '';
		prevTextValue = '';
		prevValue = '';
		isError = false;
		open = false;
		if (onchange) onchange();
	}

	function handleSetTime() {
		const h = selectedHour !== null ? String(selectedHour).padStart(2, '0') : '00';
		const m = selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : '00';
		const timeStr = `${h}:${m}`;
		value = timeStr;
		textValue = timeStr;
		prevTextValue = timeStr;
		prevValue = timeStr;
		isError = false;
		open = false;
		if (onchange) onchange();
	}

	function parseInputTime(val: string): string | null {
		const cleanVal = val.replace(/[^\d:]/g, '');
		const parts = cleanVal.split(':');
		if (parts.length === 2) {
			const hour = parseInt(parts[0], 10);
			const minute = parseInt(parts[1], 10);
			if (!isNaN(hour) && hour >= 0 && hour <= 23 && !isNaN(minute) && minute >= 0 && minute <= 59) {
				const hh = String(hour).padStart(2, '0');
				const mm = String(minute).padStart(2, '0');
				return `${hh}:${mm}`;
			}
		}
		return null;
	}

	function autoFormatTime(val: string, oldVal: string): string {
		if (val.length < oldVal.length) return val;

		let cleaned = val.replace(/[^\d:]/g, '');

		// Handle auto insert of colon
		if (cleaned.length === 2 && !cleaned.includes(':')) {
			return cleaned + ':';
		}
		if (cleaned.length === 4 && !cleaned.includes(':')) {
			return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
		}

		return cleaned;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let rawVal = target.value;
		
		const formatted = autoFormatTime(rawVal, prevTextValue);
		textValue = formatted;
		prevTextValue = formatted;
		
		if (textValue.trim() === '') {
			isError = false;
			value = '';
			prevValue = '';
			return;
		}

		const cleanTime = parseInputTime(textValue);
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
		
		const cleanTime = parseInputTime(textValue);
		if (!cleanTime) {
			isError = true;
			value = '';
			prevValue = '';
			if (onchange) onchange();
		} else {
			textValue = cleanTime;
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
						{selectedHour !== null ? String(selectedHour).padStart(2, '0') : '--'}:{selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : '--'}
					</span>
				</div>
				<div class="flex h-48">
					<!-- Hour column -->
					<div class="w-1/2 overflow-y-auto border-r border-border flex flex-col scrollbar-thin">
						<div class="text-xs text-muted-foreground text-center py-1 sticky top-0 bg-popover border-b border-border">Hrs</div>
						{#each Array.from({length: 24}) as _, h}
							<button
								type="button"
								onclick={() => { selectedHour = h; }}
								class={cn(
									"py-1.5 px-3 text-sm text-center hover:bg-accent hover:text-accent-foreground font-mono focus:outline-none transition-colors",
									selectedHour === h && "bg-[#F45310] text-white hover:bg-[#F45310] hover:text-white font-bold"
								)}
							>
								{String(h).padStart(2, '0')}
							</button>
						{/each}
					</div>
					<!-- Minute column -->
					<div class="w-1/2 overflow-y-auto flex flex-col scrollbar-thin">
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
				</div>
				<div class="flex items-center justify-between p-2 border-t border-border bg-muted/20">
					<Button variant="ghost" size="sm" onclick={handleClear}>Clear</Button>
					<Button variant="default" size="sm" class="bg-[#F45310] hover:bg-[#F45310]/90 text-white" onclick={handleSetTime}>OK</Button>
				</div>
			</Popover.Content>
		</Popover.Root>
	{/if}
</div>
