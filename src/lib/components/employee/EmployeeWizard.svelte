<script lang="ts">
	import { Button, Card, CardContent } from '$lib/components';
	import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';
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
	import { replaceState, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { untrack } from 'svelte';
	import { globalIsDirty } from '$lib/stores/navigationGuard';

	let { mode = 'create', employeeCuid = null, data } = $props<{ mode?: 'create' | 'edit' | 'view'; employeeCuid?: string | null; data?: Record<string, unknown> }>();

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

	// ── Wizard-level unsaved-changes state ──────────────────────────────────
	let stepIsDirty = $state(false);
	let pendingStep = $state<number | null>(null);
	let pendingExit = $state(false);
	let showUnsavedModal = $state(false);


	/** Called by the active step whenever its dirty state changes. */
	function handleDirtyChange(dirty: boolean) {
		stepIsDirty = dirty;
		$globalIsDirty = dirty;
	}

	/** Reset wizard dirty/save tracking when the active step changes. */
	$effect(() => {
		void currentStep;
		stepIsDirty = false;
		$globalIsDirty = false;
	});

	/** Single entry-point for ALL navigation (tabs, prev, next). */
	function requestNavigate(targetStep: number) {
		if (internalMode === 'create' && !cuid && targetStep > 1) {
			toast.error('Please save Personal Details to create the employee record before continuing.');
			return;
		}

		if (internalMode === 'view' || !stepIsDirty) {
			currentStep = targetStep;
		} else {
			pendingStep = targetStep;
			showUnsavedModal = true;
		}
	}

	function requestExit() {
		if (internalMode === 'view' || !stepIsDirty) {
			goto('/employees');
		} else {
			pendingExit = true;
			showUnsavedModal = true;
		}
	}

	function finalizePendingNavigation() {
		showUnsavedModal = false;
		$globalIsDirty = false;
		if (pendingExit) {
			goto('/employees');
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
		pendingExit = false;
	}

	// ── Standard next/prev ──────────
	function handleNext(newCuid?: string) {
		if (newCuid && newCuid !== cuid) {
			cuid = newCuid;
			if (internalMode === 'create') {
				replaceState(`/employees/${cuid}`, $page.state);
				internalMode = 'edit';
			}
		}
		if (currentStep < steps.length) {
			requestNavigate(currentStep + 1);
		}
	}

	function handlePrev() {
		if (currentStep > 1) {
			requestNavigate(currentStep - 1);
		}
	}

	let navElement = $state<HTMLElement | null>(null);

	$effect(() => {
		if (navElement && currentStep) {
			const activeItem = navElement.children[currentStep - 1] as HTMLElement;
			if (activeItem) {
				activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
			}
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
				{#if internalMode === 'view'}
					<Button variant="outline" size="sm" onclick={() => internalMode = 'edit'}>
						Edit Employee
					</Button>
				{/if}
			</div>
			
			<h1 class="text-2xl font-bold tracking-tight">
				{#if internalMode === 'create'}
					Add New Employee
				{:else if internalMode === 'edit'}
					Edit Employee
				{:else}
					View Employee
				{/if}
			</h1>
		</div>

		<!-- Wizard Navigation Header -->
		<div class="bg-background border border-border rounded-lg p-3 sm:p-4 shadow-sm overflow-x-auto overflow-y-hidden custom-scrollbar">
			<ol bind:this={navElement} class="flex flex-nowrap items-center justify-center min-w-full w-max mx-auto gap-x-2 sm:gap-x-4 text-sm font-medium text-muted-foreground">
				{#each steps as step, index (step)}
					{@const stepNum = index + 1}
					{@const isCurrent = stepNum === currentStep}
					<li class="flex items-center">
						<button
							type="button"
							class="flex items-center cursor-pointer hover:opacity-80 transition-colors px-2 py-1 rounded-md"
							onclick={() => requestNavigate(stepNum)}
						>
							<span class="text-sm whitespace-nowrap {isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}">
								{step}
							</span>
						</button>
						{#if index < steps.length - 1}
							<div class="w-3 sm:w-5 h-px bg-border mx-1"></div>
						{/if}
					</li>
				{/each}
			</ol>
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

