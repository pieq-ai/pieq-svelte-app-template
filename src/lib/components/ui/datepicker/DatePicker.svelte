<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { untrack } from 'svelte';

	let {
		value = $bindable(''),
		placeholder = "MM/DD/YYYY",
		id = "",
		name = "",
		required = false,
		disabled = false,
		min = "",
		max = "",
		class: className = "",
		hasError = false,
		onchange
	}: {
		value: string;
		placeholder?: string;
		id?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		min?: string;
		max?: string;
		class?: string;
		hasError?: boolean;
		onchange?: (val: string) => void;
	} = $props();

	let isOpen = $state(false);
	let inputValue = $state('');
	let showMonthYearPanel = $state(false);
	
	const today = new Date();
	let currentMonth = $state(today.getMonth());
	let currentYear = $state(today.getFullYear());

	let minYear = $derived(min ? parseInt(min.split('-')[0]) : 1900);
	let maxYear = $derived(max ? parseInt(max.split('-')[0]) : 2100);

	$effect(() => {
		if (!isOpen) {
			showMonthYearPanel = false;
		}
	});

	let triggerContainer = $state<HTMLDivElement | null>(null);
	let popupPosition = $state({ top: 0, left: 0 });

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	// Sync value -> inputValue display
	$effect(() => {
		const currentVal = value;
		untrack(() => {
			if (currentVal) {
				const parts = currentVal.split('-');
				if (parts.length === 3) {
					const expected = `${parts[1]}/${parts[2]}/${parts[0]}`;
					if (inputValue !== expected) {
						inputValue = expected;
					}
					const valYear = parseInt(parts[0]);
					const valMonth = parseInt(parts[1]) - 1;
					if (currentYear !== valYear || currentMonth !== valMonth) {
						currentYear = valYear;
						currentMonth = valMonth;
					}
				}
			} else {
				inputValue = '';
			}
		});
	});

	function isDateToday(year: number, month: number, day: number) {
		const d = new Date();
		return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
	}

	function isDateSelected(year: number, month: number, day: number) {
		if (!value) return false;
		const parts = value.split('-');
		if (parts.length !== 3) return false;
		return parseInt(parts[0]) === year && parseInt(parts[1]) === month + 1 && parseInt(parts[2]) === day;
	}

	function isDateDisabled(dateStr: string) {
		if (min && dateStr < min) return true;
		if (max && dateStr > max) return true;
		return false;
	}

	let currentMonthDays = $derived.by(() => {
		const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
		const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

		const days = [];

		// Prev month days
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const prevMonthVal = currentMonth === 0 ? 11 : currentMonth - 1;
			const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
			const dayVal = totalDaysInPrevMonth - i;
			const cellDateStr = `${prevYearVal}-${String(prevMonthVal + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
			days.push({
				day: dayVal,
				month: prevMonthVal,
				year: prevYearVal,
				isCurrentMonth: false,
				isToday: isDateToday(prevYearVal, prevMonthVal, dayVal),
				isSelected: isDateSelected(prevYearVal, prevMonthVal, dayVal),
				isDisabled: isDateDisabled(cellDateStr),
				dateStr: cellDateStr
			});
		}

		// Current month days
		for (let i = 1; i <= totalDaysInMonth; i++) {
			const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({
				day: i,
				month: currentMonth,
				year: currentYear,
				isCurrentMonth: true,
				isToday: isDateToday(currentYear, currentMonth, i),
				isSelected: isDateSelected(currentYear, currentMonth, i),
				isDisabled: isDateDisabled(cellDateStr),
				dateStr: cellDateStr
			});
		}

		// Next month days to fill grid of 42
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const nextMonthVal = currentMonth === 11 ? 0 : currentMonth + 1;
			const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
			const cellDateStr = `${nextYearVal}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({
				day: i,
				month: nextMonthVal,
				year: nextYearVal,
				isCurrentMonth: false,
				isToday: isDateToday(nextYearVal, nextMonthVal, i),
				isSelected: isDateSelected(nextYearVal, nextMonthVal, i),
				isDisabled: isDateDisabled(cellDateStr),
				dateStr: cellDateStr
			});
		}

		return days;
	});

	function updatePopupPosition() {
		if (triggerContainer) {
			const rect = triggerContainer.getBoundingClientRect();
			popupPosition = {
				top: rect.bottom + 4,
				left: rect.left
			};
		}
	}

	$effect(() => {
		if (!isOpen || !triggerContainer) return;

		window.addEventListener('scroll', updatePopupPosition, { capture: true, passive: true });
		window.addEventListener('resize', updatePopupPosition, { passive: true });

		let frameId: number;
		const loop = () => {
			updatePopupPosition();
			frameId = requestAnimationFrame(loop);
		};
		frameId = requestAnimationFrame(loop);

		return () => {
			window.removeEventListener('scroll', updatePopupPosition, { capture: true });
			window.removeEventListener('resize', updatePopupPosition);
			cancelAnimationFrame(frameId);
		};
	});

	$effect(() => {
		const handleDismiss = (e: MouseEvent) => {
			if (isOpen && triggerContainer) {
				const target = e.target as HTMLElement;
				const isPopupClick = target.closest('.datepicker-popup');
				if (!triggerContainer.contains(target) && !isPopupClick) {
					isOpen = false;
				}
			}
		};
		document.addEventListener('click', handleDismiss, { capture: true });
		return () => {
			document.removeEventListener('click', handleDismiss, { capture: true });
		};
	});

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else {
			currentMonth -= 1;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear += 1;
		} else {
			currentMonth += 1;
		}
	}

	function prevYear() {
		currentYear -= 1;
	}

	function nextYear() {
		currentYear += 1;
	}

	function selectDay(cell: { dateStr: string; month: number; year: number }) {
		value = cell.dateStr;
		isOpen = false;
		if (onchange) {
			onchange(cell.dateStr);
		}
	}

	function clearDate() {
		value = '';
		inputValue = '';
		isOpen = false;
		if (onchange) {
			onchange('');
		}
	}

	function selectToday() {
		const today = new Date();
		const isoStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
		if (!isDateDisabled(isoStr)) {
			value = isoStr;
			currentMonth = today.getMonth();
			currentYear = today.getFullYear();
			isOpen = false;
			if (onchange) {
				onchange(isoStr);
			}
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;

		const match = inputValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
		if (match) {
			const month = parseInt(match[1]) - 1;
			const day = parseInt(match[2]);
			const year = parseInt(match[3]);

			const d = new Date(year, month, day);
			if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
				const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
				if (!isDateDisabled(isoStr)) {
					value = isoStr;
					currentMonth = month;
					currentYear = year;
					if (onchange) {
						onchange(isoStr);
					}
				}
			}
		}
	}

	function handleBlur() {
		if (value) {
			const parts = value.split('-');
			if (parts.length === 3) {
				inputValue = `${parts[1]}/${parts[2]}/${parts[0]}`;
			}
		} else {
			inputValue = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		} else if (event.key === 'Enter') {
			isOpen = !isOpen;
		}
	}
</script>

<div bind:this={triggerContainer} class="relative w-full">
	{#if name}
		<input type="hidden" {name} {id} value={value ?? ''} {required} />
	{/if}

	<div class="relative flex items-center">
		<!-- Calendar Icon -->
		<span class="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
		</span>
		
		<input
			type="text"
			{disabled}
			{placeholder}
			value={inputValue}
			oninput={handleInput}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			onclick={() => { if (!disabled) { isOpen = true; updatePopupPosition(); } }}
			class={cn(
				"dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent pl-10 pr-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 select-text",
				hasError && "border-destructive focus-visible:ring-destructive/30",
				className
			)}
		/>
	</div>

	{#if isOpen}
		<div
			style="position: fixed; top: {popupPosition.top}px; left: {popupPosition.left}px;"
			class="datepicker-popup z-100 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-lg w-[280px] select-none text-left"
		>
			{#if showMonthYearPanel}
				<!-- Month/Year panel -->
				<div class="flex items-center justify-between mb-4">
					<button
						type="button"
						onclick={prevYear}
						class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 p-0.5 cursor-pointer font-bold text-xs select-none transition-colors"
						title="Previous Year"
					>
						«
					</button>
					
					<select
						bind:value={currentYear}
						class="bg-transparent font-medium text-neutral-900 dark:text-neutral-100 text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-0.5 outline-none cursor-pointer text-center"
					>
						{#each Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i) as yr}
							<option value={yr} class="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">{yr}</option>
						{/each}
					</select>

					<button
						type="button"
						onclick={nextYear}
						class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 p-0.5 cursor-pointer font-bold text-xs select-none transition-colors"
						title="Next Year"
					>
						»
					</button>
				</div>
				
				<div class="grid grid-cols-3 gap-2 mb-4">
					{#each monthNames as monthName, index}
						<button
							type="button"
							onclick={() => {
								currentMonth = index;
								showMonthYearPanel = false;
							}}
							class={cn(
								"py-2 text-center text-xs rounded-md cursor-pointer transition-all font-medium",
								currentMonth === index 
									? "bg-[#262626] text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold" 
									: "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
							)}
						>
							{monthName.substring(0, 3)}
						</button>
					{/each}
				</div>

				<div class="flex items-center justify-center border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-3 text-xs">
					<button
						type="button"
						onclick={() => showMonthYearPanel = false}
						class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 font-medium cursor-pointer transition-colors"
					>
						Back to Calendar
					</button>
				</div>
			{:else}
				<!-- Header Month/Year Selector -->
				<div class="flex items-center justify-between mb-4">
					<div class="flex gap-2">
						<button
							type="button"
							onclick={prevYear}
							class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 p-0.5 cursor-pointer font-bold text-xs select-none transition-colors"
							title="Previous Year"
						>
							«
						</button>
						<button
							type="button"
							onclick={prevMonth}
							class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 p-0.5 cursor-pointer font-bold text-xs select-none transition-colors"
							title="Previous Month"
						>
							‹
						</button>
					</div>
					
					<button
						type="button"
						onclick={() => showMonthYearPanel = true}
						class="font-medium text-neutral-900 dark:text-neutral-100 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer select-none border-none outline-none"
						title="Select Month and Year"
					>
						{monthNames[currentMonth]} {currentYear}
					</button>

					<div class="flex gap-2">
						<button
							type="button"
							onclick={nextMonth}
							class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 p-0.5 cursor-pointer font-bold text-xs select-none transition-colors"
							title="Next Month"
						>
							›
						</button>
						<button
							type="button"
							onclick={nextYear}
							class="text-neutral-500 hover:text-[#262626] dark:hover:text-neutral-100 p-0.5 cursor-pointer font-bold text-xs select-none transition-colors"
							title="Next Year"
						>
							»
						</button>
					</div>
				</div>

				<!-- Weekday Headers -->
				<div class="grid grid-cols-7 gap-1 text-center text-xs font-bold mb-2">
					{#each weekdays as day}
						<span class="pb-1 border-b border-dotted border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
							{day}
						</span>
					{/each}
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 gap-1 text-center text-sm">
					{#each currentMonthDays as cell}
						<button
							type="button"
							disabled={cell.isDisabled}
							onclick={() => selectDay(cell)}
							class={cn(
								"h-8 w-8 flex items-center justify-center rounded-md cursor-pointer transition-all select-none text-xs font-medium",
								cell.isCurrentMonth ? "text-neutral-950 dark:text-neutral-50" : "text-neutral-400 dark:text-neutral-600",
								cell.isToday && "border border-[#F45310] text-[#F45310] font-medium",
								cell.isSelected ? "bg-[#262626] text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold" : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
								cell.isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
							)}
						>
							{cell.day}
						</button>
					{/each}
				</div>

				<!-- Footer Clear/Today Buttons -->
				<div class="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-3 text-xs">
					<button
						type="button"
						onclick={clearDate}
						class="text-danger hover:text-danger/80 font-medium cursor-pointer transition-colors"
					>
						Clear
					</button>
					<button
						type="button"
						onclick={selectToday}
						class="text-[#262626] dark:text-neutral-200 hover:text-[#F45310] font-medium cursor-pointer transition-colors"
					>
						Today
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
