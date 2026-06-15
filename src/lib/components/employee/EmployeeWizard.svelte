<script lang="ts">
	import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components';

	import StepPersonal from './steps/StepPersonal.svelte';
	import StepEmployment from './steps/StepEmployment.svelte';
	import StepAddress from './steps/StepAddress.svelte';
	import StepEducation from './steps/StepEducation.svelte';
	import StepExperience from './steps/StepExperience.svelte';
	import StepSkills from './steps/StepSkills.svelte';
	import StepLanguages from './steps/StepLanguages.svelte';
	import StepDocuments from './steps/StepDocuments.svelte';
	import StepBankDetails from './steps/StepBankDetails.svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/stores';

	let { mode = 'create', employeeCuid = null, data } = $props<{ mode?: 'create' | 'edit' | 'view'; employeeCuid?: string | null; data?: Record<string, unknown> }>();

	import { untrack } from 'svelte';
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

	function handleNext(newCuid?: string) {
		if (newCuid && newCuid !== cuid) {
			cuid = newCuid;
			// Update the URL to include the new cuid if we are creating
			if (internalMode === 'create') {
				// We don't want to reload the page, just update URL
				replaceState(`/employees/${cuid}`, $page.state);
				internalMode = 'edit'; // After creation, subsequent saves are edits
			}
		}
		if (currentStep < steps.length) {
			currentStep++;
		}
	}

	function handlePrev() {
		if (currentStep > 1) {
			currentStep--;
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

<div class="flex justify-center p-4 md:py-8 bg-muted/10 min-h-screen">
	<div class="w-full max-w-6xl space-y-6">
		<Button variant="ghost" class="pl-0 text-muted-foreground hover:text-foreground mb-2" href="/employees">
			Back to Employees
		</Button>

		<!-- Wizard Navigation Header -->
		<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
			<ol bind:this={navElement} class="flex items-center w-full space-x-2 text-sm font-medium text-center text-muted-foreground overflow-x-auto pb-2 custom-scrollbar">
				{#each steps as step, index (step)}
					{@const stepNum = index + 1}
					{@const isCurrent = stepNum === currentStep}
					<li class="flex items-center shrink-0">
						<button 
							type="button" 
							class="flex items-center cursor-pointer hover:opacity-80 transition-colors" 
							onclick={() => { currentStep = stepNum; }}
						>
							<span class="text-sm {isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}">
								{step}
							</span>
						</button>
						{#if index < steps.length - 1}
							<div class="w-8 h-px bg-border mx-2"></div>
						{/if}
					</li>
				{/each}
			</ol>
		</div>

		<Card class="w-full shadow-sm">
			<CardHeader class="border-b border-border bg-muted/30 pb-6 px-6 md:px-8">
				<CardTitle class="text-2xl font-bold flex justify-between items-center">
					<div>
						{#if internalMode === 'create'}
							Add New Employee
						{:else if internalMode === 'edit'}
							Edit Employee
						{:else}
							View Employee
						{/if}
					</div>
					{#if internalMode === 'view'}
						<Button variant="outline" onclick={() => internalMode = 'edit'}>
							Edit Employee
						</Button>
					{/if}
				</CardTitle>
				<CardDescription>
					Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
				</CardDescription>
			</CardHeader>

			<CardContent class="p-6 md:p-8">
				<!-- Step Content rendered here -->
				{#if currentStep === 1}
					<StepPersonal mode={internalMode} {cuid} {data} onNext={handleNext} />
				{:else if currentStep === 2}
					<StepEmployment mode={internalMode} {cuid} {data} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 3}
					<StepAddress mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 4}
					<StepEducation mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 5}
					<StepExperience mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 6}
					<StepSkills mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 7}
					<StepLanguages mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 8}
					<StepDocuments mode={internalMode} {cuid} onNext={handleNext} onPrev={handlePrev} />
				{:else if currentStep === 9}
					<StepBankDetails mode={internalMode} {cuid} onPrev={handlePrev} />
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<style>
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
