<script lang="ts">
	import { Button, Card, CardContent } from '$lib/components';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { toast } from 'svelte-sonner';

	import StepPersonal from './steps/StepPersonal.svelte';
	import StepEmployment from './steps/StepEmployment.svelte';
	import StepAddress from './steps/StepAddress.svelte';
	import StepEducation from './steps/StepEducation.svelte';
	import StepExperience from './steps/StepExperience.svelte';
	import StepSkills from './steps/StepSkills.svelte';
	import StepLanguages from './steps/StepLanguages.svelte';
	import StepDocuments from './steps/StepDocuments.svelte';
	import StepBankDetails from './steps/StepBankDetails.svelte';
	import { replaceState, goto, beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { untrack, onMount } from 'svelte';
	import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';

	let { mode = 'create', employeeCuid = null, data } = $props<{ mode?: 'create' | 'edit'; employeeCuid?: string | null; data?: Record<string, any> }>();

	let currentStep = $state(1);
	let cuid = $state(untrack(() => employeeCuid));
	let internalMode = $state(untrack(() => mode));

	$effect(() => {
		if (employeeCuid && employeeCuid !== cuid) {
			cuid = employeeCuid;
		}
	});

	$effect(() => {
		if (mode !== internalMode && mode === 'create') {
			internalMode = 'create';
		}
	});

	const steps = [
		'Personal Details',
		'Employment Details',
		'Address',
		'Education',
		'Experience',
		'Skills',
		'Languages',
		'Documents',
		'Bank Details'
	];

	let stepIsDirty = $state(false);
	let showUnsavedModal = $state(false);
	let pendingStep = $state<number | null>(null);
	let pendingExitUrl = $state<string | null>(null);

	/** Called by the active step whenever its dirty state changes. */
	function handleDirtyChange(dirty: boolean) {
		stepIsDirty = dirty;
	}

	/** Reset wizard dirty/save tracking when the active step changes. */
	$effect(() => {
		void currentStep;
		stepIsDirty = false;
	});

	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (stepIsDirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	onMount(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	beforeNavigate(({ to, cancel, type }) => {
		if (stepIsDirty) {
			if (type === 'unload') {
				// Browser Handles this via beforeunload listener
				return;
			}
			cancel();
			if (to?.url) {
				pendingExitUrl = to.url.pathname + to.url.search;
				showUnsavedModal = true;
			}
		}
	});

	/** Single entry-point for ALL navigation (tabs, prev, next). */
	function requestNavigate(targetStep: number) {
		if (internalMode === 'create' && !cuid && targetStep > 1) {
			toast.error('Please save Personal Details to create the employee record before continuing.');
			return;
		}

		if (stepIsDirty) {
			pendingStep = targetStep;
			showUnsavedModal = true;
		} else {
			currentStep = targetStep;
		}
	}

	function requestExit() {
		// Relay entirely on the beforeNavigate guard to catch it
		goto('/employees');
	}

	function finalizePendingNavigation() {
		showUnsavedModal = false;
		stepIsDirty = false;
		if (pendingExitUrl) {
			goto(pendingExitUrl);
			pendingExitUrl = null;
			return;
		}
		if (pendingStep !== null) {
			currentStep = pendingStep;
			pendingStep = null;
		}
	}

	function handleModalCancel() {
		showUnsavedModal = false;
		pendingStep = null;
		pendingExitUrl = null;
	}

	// ── Standard next/prev ──────────
	function handleNext(newCuid?: string) {
		stepIsDirty = false; // We just saved, so force clear any async dirty state
		if (newCuid && newCuid !== cuid) {
			cuid = newCuid;
			if (internalMode === 'create') {
				replaceState(`/employees/${cuid}`, $page.state);
				internalMode = 'edit';
			}
		}
		if (currentStep < steps.length) {
			requestNavigate(currentStep + 1);
		} else {
			goto('/employees');
		}
	}

	function handlePrev() {
		if (currentStep > 1) {
			requestNavigate(currentStep - 1);
		}
	}

	let navElement = $state<HTMLElement | null>(null);
	let tabRefs = $state<HTMLElement[]>([]);
	let activeTabLeft = $state(0);
	let activeTabWidth = $state(0);
	let isInitialized = $state(false);
	let isResizing = $state(true);
	let resizeTimeout: ReturnType<typeof setTimeout>;

	function updatePillPosition() {
		if (tabRefs.length < steps.length) return;
		const activeItem = tabRefs[currentStep - 1];
		if (activeItem) {
			activeTabLeft = activeItem.offsetLeft;
			activeTabWidth = activeItem.offsetWidth;
			if (!isInitialized && activeTabWidth > 0) {
				isInitialized = true;
			}
		}
	}

	function handleResize() {
		isResizing = true;
		updatePillPosition();
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			isResizing = false;
		}, 100);
	}

	$effect(() => {
		if (navElement && currentStep) {
			updatePillPosition();
			const activeItem = tabRefs[currentStep - 1];
			if (activeItem && isInitialized) {
				activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
			}
		}
	});

	$effect(() => {
		if (navElement) {
			const resizeObserver = new ResizeObserver(() => {
				handleResize();
			});
			resizeObserver.observe(navElement);
			window.addEventListener('resize', handleResize);
			
			return () => {
				resizeObserver.disconnect();
				window.removeEventListener('resize', handleResize);
			};
		}
	});
</script>

<div class="w-full px-1 py-0">
	<div class="w-full space-y-4">
		<div class="flex flex-col space-y-2">
			<div class="flex items-center justify-between">
				<Button variant="ghost" class="pl-0 text-muted-foreground hover:text-foreground" onclick={requestExit}>
					<ArrowLeftIcon class="mr-2 size-4" />
					Back to Employees
				</Button>
			</div>
			
			<h1 class="text-2xl font-bold tracking-tight">
				{#if internalMode === 'create'}
					Add New Employee
				{:else}
					{#if data?.employee}{data.employee.emp_code} {data.employee.first_name} {data.employee.last_name || ''}{/if}
				{/if}
			</h1>
		</div>

		<!-- Wizard Navigation Header -->
		<div class="bg-muted/20 border border-border rounded-2xl p-1.5 shadow-sm overflow-x-auto overflow-y-hidden custom-scrollbar max-w-[1400px] mx-auto w-full" role="tablist" aria-orientation="horizontal">
			<div bind:this={navElement} class="relative flex flex-nowrap items-stretch justify-between w-full min-w-max gap-x-1 text-sm font-medium text-muted-foreground">
				
				<!-- Animated Active Pill -->
				{#if isInitialized && activeTabWidth > 0}
					<div 
						class="absolute top-0 bottom-0 bg-[#f43510] rounded-xl shadow-md z-0 pointer-events-none {isResizing ? '' : 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'}"
						style="
							transform: translate3d({activeTabLeft}px, 0, 0); 
							width: {activeTabWidth}px;
							will-change: transform, width;
						"
					></div>
				{/if}

				{#each steps as step, index (step)}
					{@const stepNum = index + 1}
					{@const isCurrent = stepNum === currentStep}
					<button
						bind:this={tabRefs[index]}
						type="button"
						role="tab"
						aria-selected={isCurrent}
						class="relative flex-1 z-10 flex items-center justify-center cursor-pointer px-4 py-2 rounded-xl transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43510] focus-visible:ring-offset-2 {isCurrent ? 'text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
						onclick={() => requestNavigate(stepNum)}
					>
						<span class="text-sm whitespace-nowrap">
							{step}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<Card class="w-full shadow-sm">
			<CardContent class="p-4 md:p-6 pt-4 md:pt-6">
				<!-- Step Content rendered here -->
				{#if currentStep === 1}
					<StepPersonal mode={internalMode} {cuid} {data} onNext={handleNext}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 2}
					<StepEmployment mode={internalMode} {cuid} {data} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 3}
					<StepAddress mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 4}
					<StepEducation mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 5}
					<StepExperience mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 6}
					<StepSkills mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 7}
					<StepLanguages mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 8}
					<StepDocuments mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{:else if currentStep === 9}
					<StepBankDetails mode={internalMode} {cuid} onPrev={handlePrev}
						onDirtyChange={handleDirtyChange}
						onCancel={requestExit} />
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- Wizard-level Unsaved Changes Modal -->
<ConfirmModal
	open={showUnsavedModal}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
	cancelLabel="Keep Editing"
	confirmLabel="Cancel"
	onCancel={() => handleModalCancel()}
	onConfirm={() => finalizePendingNavigation()}
/>



<style>
	.custom-scrollbar {
		scrollbar-width: thin;
	}
	.custom-scrollbar::-webkit-scrollbar {
		height: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: hsl(var(--muted-foreground) / 0.3);
		border-radius: 10px;
	}
</style>

