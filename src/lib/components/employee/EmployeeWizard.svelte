<script lang="ts">
	import { Button, Card, CardHeader, CardTitle, CardDescription } from '$lib/components';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CheckIcon from '@lucide/svelte/icons/check';
	import StepPersonal from './steps/StepPersonal.svelte';
	import StepEmployment from './steps/StepEmployment.svelte';
	import StepAddress from './steps/StepAddress.svelte';
	import StepEducation from './steps/StepEducation.svelte';
	import StepExperience from './steps/StepExperience.svelte';
	import StepSkills from './steps/StepSkills.svelte';
	import StepLanguages from './steps/StepLanguages.svelte';
	import StepDocuments from './steps/StepDocuments.svelte';
	import StepBankDetails from './steps/StepBankDetails.svelte';

	let { mode = 'create', employeeCuid = null, data } = $props<{ mode: 'create' | 'edit' | 'view'; employeeCuid?: string | null; data?: Record<string, unknown> }>();

	let currentStep = $state(1);
	let initialCuid = employeeCuid;
	let cuid = $state(initialCuid);

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
		if (newCuid) cuid = newCuid;
		if (currentStep < steps.length) {
			currentStep++;
		}
	}

	function handlePrev() {
		if (currentStep > 1) {
			currentStep--;
		}
	}
</script>

<div class="flex justify-center p-4 md:py-8 bg-muted/10 min-h-screen">
	<div class="w-full max-w-6xl space-y-6">
		<Button variant="ghost" class="pl-0 text-muted-foreground hover:text-foreground mb-2" href="/employees">
			<ArrowLeftIcon class="mr-2 size-4" /> Back to Employees
		</Button>

		<!-- Wizard Navigation Header -->
		<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
			<ol class="flex items-center w-full space-x-2 text-sm font-medium text-center text-muted-foreground overflow-x-auto pb-2 custom-scrollbar">
				{#each steps as step, index (step)}
					{@const stepNum = index + 1}
					{@const isCompleted = stepNum < currentStep}
					{@const isCurrent = stepNum === currentStep}
					<li class="flex items-center shrink-0">
						<span class="flex items-center justify-center size-8 rounded-full border border-border mr-2 shrink-0
							{isCompleted ? 'bg-primary text-primary-foreground border-primary' : ''}
							{isCurrent ? 'bg-primary/20 border-primary text-primary font-bold' : ''}">
							{#if isCompleted}
								<CheckIcon class="size-4" />
							{:else}
								{stepNum}
							{/if}
						</span>
						<span class="mr-2 {isCurrent ? 'text-foreground font-semibold' : ''} {isCompleted ? 'text-foreground' : ''}">
							{step}
						</span>
						{#if index < steps.length - 1}
							<div class="w-8 h-px bg-border mx-2"></div>
						{/if}
					</li>
				{/each}
			</ol>
		</div>

		<Card class="w-full shadow-sm">
			<CardHeader class="border-b border-border bg-muted/30 pb-6 px-6 md:px-8">
				<CardTitle class="text-2xl font-bold">
					{#if mode === 'create'}
						Add New Employee
					{:else if mode === 'edit'}
						Edit Employee
					{:else}
						View Employee
					{/if}
				</CardTitle>
				<CardDescription>
					Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
				</CardDescription>
			</CardHeader>

			<!-- Step Content rendered here -->
			{#if currentStep === 1}
				<StepPersonal {mode} {cuid} onNext={handleNext} />
			{:else if currentStep === 2}
				<StepEmployment {mode} {cuid} {data} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 3}
				<StepAddress {mode} {cuid} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 4}
				<StepEducation {mode} {cuid} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 5}
				<StepExperience {mode} {cuid} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 6}
				<StepSkills {mode} {cuid} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 7}
				<StepLanguages {mode} {cuid} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 8}
				<StepDocuments {mode} {cuid} onNext={handleNext} onPrev={handlePrev} />
			{:else if currentStep === 9}
				<StepBankDetails {mode} {cuid} onPrev={handlePrev} />
			{/if}
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
