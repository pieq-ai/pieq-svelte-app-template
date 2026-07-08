<script lang="ts">
  import {
    Label,
    Input,
    SearchableDropdown,
    DatePicker,
    Button,
  } from "$lib/components";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import { normalizeText, validateLettersSpaces } from "$lib/utils/employeeValidationHelper";
  import { getContext } from 'svelte';
  import { EMPLOYEE_API_CONTEXT, type EmployeeApiClient } from '../context';
  import { SvelteDate } from "svelte/reactivity";
  import { parseBackendErrors } from "$lib/utils/errors.js";
  import { onMount } from "svelte";

  let { mode, cuid, onNext, onPrev, onDirtyChange, onCancel } = $props<{
    mode: "create" | "edit";
    cuid: string | null;
    onNext: () => void;
    onPrev: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onCancel: () => void;
  }>();

  let apiClient = getContext<() => EmployeeApiClient>(EMPLOYEE_API_CONTEXT)();

  let isSubmitting = $state(false);
  let isTouched = $state(false);
  let backendErrors = $state<Record<string, string>>({});

  type EduItem = {
    education_level: string;
    specialization: string;
    institution: string;
    university_board: string;
    percentage: string;
    completed_at: string;
  };

  const emptyEdu = (): EduItem => ({
    education_level: "",
    specialization: "",
    institution: "",
    university_board: "",
    percentage: "",
    completed_at: "",
  });

  let educations = $state<EduItem[]>([]);
  let originalData = $state("[]");

  function addEducation() {
    educations = [...educations, emptyEdu()];
  }

  function normalizeEduItem(item: Partial<EduItem>): EduItem {
    let completedAt = item.completed_at || "";
    if (completedAt) {
      completedAt = String(completedAt).split("T")[0];
    }
    let percentage = item.percentage;
    if (percentage !== null && percentage !== undefined) {
      percentage = String(parseFloat(String(percentage)));
    } else {
      percentage = "";
    }
    return {
      education_level: item.education_level || "",
      specialization: item.specialization || "",
      institution: item.institution || "",
      university_board: item.university_board || "",
      percentage,
      completed_at: completedAt,
    };
  }
  function normalizeEducations(list: Partial<EduItem>[]): EduItem[] {
    return (list || []).map(normalizeEduItem);
  }

  onMount(async () => {
    if (cuid && apiClient.mode !== 'self') {
      try {
        const res = await fetch(apiClient.getBaseUrl('educations'), {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const body = await res.json();
        if (res.ok && body.data) {
          educations = body.data;
        }
      } catch (e) {
        console.error("Failed to fetch educations", e);
      }
    }
    if (educations.length === 0) {
      addEducation();
    }
    originalData = JSON.stringify(normalizeEducations(educations));
  });

  let isDirty = $derived(
    JSON.stringify(normalizeEducations(educations)) !== originalData,
  );

  $effect(() => {
    onDirtyChange?.(isDirty);
  });

  // Validations
  function validateRequired(val: string | undefined | null) {
    return val && val.trim().length > 0 ? "" : "Required";
  }
  function specializationError(val: string) {
    if (!val || !val.trim()) return "Required";
    return validateLettersSpaces(val, 'Specialization');
  }
  function institutionError(val: string) {
    if (!val || !val.trim()) return "Required";
    return validateLettersSpaces(val, 'Institution name');
  }
  function universityBoardError(val: string) {
    if (!val || !val.trim()) return "Required";
    return validateLettersSpaces(val, 'University/Board');
  }
  function validatePercentage(val: string | undefined | null) {
    if (!val) return ""; // optional
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) return "Must be 0–100";
    return "";
  }
  function validatePastDate(date: string) {
    if (!date) return "Required";
    const dt = new SvelteDate(date);
    if (isNaN(dt.getTime())) return "Invalid date.";
    if (dt > new SvelteDate()) return "Cannot be a future date.";
    return "";
  }

  let hasErrors = $derived(
    educations.some(
      (e) =>
        validateRequired(e.education_level) ||
        specializationError(e.specialization) ||
        institutionError(e.institution) ||
        universityBoardError(e.university_board) ||
        validatePercentage(e.percentage?.toString()) ||
        validatePastDate(e.completed_at),
    ),
  );

  async function saveOnly(): Promise<{ success: boolean }> {
    isTouched = true;
    backendErrors = {};
    if (hasErrors) {
      return { success: false };
    }
    if (!cuid) return { success: false };

    try {
      isSubmitting = true;
      const res = await fetch(apiClient.getBaseUrl('educations'), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(educations),
      });
      if (!res.ok) {
        const body = await res.json();
        const parsed = parseBackendErrors(body);
        if (parsed.field) {
          backendErrors = { [parsed.field]: parsed.message };
        } else {
          toast.error(parsed.message || "Failed to save educations");
        }
        return { success: false };
      }
      originalData = JSON.stringify(normalizeEducations(educations));
      toast.success("Updated successfully");
      return { success: true };
    } catch (e: unknown) {
      toast.error((e as Error).message);
      return { success: false };
    } finally {
      isSubmitting = false;
    }
  }

  async function save() {
    const result = await saveOnly();
    if (!result.success) return;
    onNext();
  }
</script>

<div class="space-y-4 -mt-6">
  {#if mode !== "view"}
    <div class="flex justify-end">
      <Button
        class="bg-hrms-primary text-white hover:bg-hrms-primary/90"
        onclick={addEducation}
        disabled={isSubmitting}
      >
        Add Education
      </Button>
    </div>
  {/if}

  {#if educations.length === 0 && mode === "view"}
    <p class="text-sm text-muted-foreground text-center py-4">
      No education records found.
    </p>
  {/if}

  {#each educations as edu, index (index)}
    <div class="rounded-lg border border-border p-4 relative">
      {#if mode !== "view"}
        <div class="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-destructive hover:bg-destructive/10"
            onclick={() =>
              (educations = educations.filter((_, i) => i !== index))}
          >
            Delete
          </Button>
        </div>
      {/if}
      {#if backendErrors.root}
        <p class="text-sm text-destructive font-medium -mb-2 col-span-full">{backendErrors.root}</p>
      {/if}
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div class="space-y-2">
          <SearchableDropdown
            label="Education Level *"
            value={edu.education_level}
            options={[
              { id: "10th", label: "10th Standard" },
              { id: "12th", label: "12th Standard" },
              { id: "diploma", label: "Diploma" },
              { id: "bachelors", label: "Bachelors Degree" },
              { id: "masters", label: "Masters Degree" },
              { id: "doctorate", label: "Doctorate (Ph.D)" },
            ]}
            onSelect={(val) => (edu.education_level = val as string)}
            disabled={mode === "view"}
            class={isTouched && validateRequired(edu.education_level) ? "border-destructive" : ""}
          />
          {#if isTouched && validateRequired(edu.education_level)}
            <p class="text-xs text-destructive">Required</p>
          {/if}
        </div>
        <div class="space-y-2">
          <Label>Specialization/Major <span class="text-destructive">*</span></Label>
          <Input
            bind:value={edu.specialization}
            placeholder="e.g. Computer Science"
            onblur={() => (edu.specialization = normalizeText(edu.specialization))}
            class={isTouched && specializationError(edu.specialization)
              ? "border-destructive focus-visible:ring-destructive/50"
              : ""}
          />
          {#if isTouched && specializationError(edu.specialization)}<p
              class="text-xs text-destructive"
            >
              {specializationError(edu.specialization)}
            </p>{/if}
        </div>
        <div class="space-y-2 xl:col-span-2">
          <Label>Institution/School <span class="text-destructive">*</span></Label>
          <Input
            bind:value={edu.institution}
            placeholder="Institution Name"
            onblur={() => (edu.institution = normalizeText(edu.institution))}
            class={isTouched && institutionError(edu.institution)
              ? "border-destructive focus-visible:ring-destructive/50"
              : ""}
          />
          {#if isTouched && institutionError(edu.institution)}<p
              class="text-xs text-destructive"
            >
              {institutionError(edu.institution)}
            </p>{/if}
        </div>
        <div class="space-y-2 xl:col-span-2">
          <Label>University/Board <span class="text-destructive">*</span></Label>
          <Input
            bind:value={edu.university_board}
            placeholder="University/Board Name"
            onblur={() => (edu.university_board = normalizeText(edu.university_board))}
            class={isTouched && universityBoardError(edu.university_board)
              ? "border-destructive focus-visible:ring-destructive/50"
              : ""}
          />
          {#if isTouched && universityBoardError(edu.university_board)}<p
              class="text-xs text-destructive"
            >
              {universityBoardError(edu.university_board)}
            </p>{/if}
        </div>
        <div class="space-y-2">
          <Label>Percentage/CGPA</Label>
          <Input
            type="number"
            step="0.01"
            bind:value={edu.percentage}
            placeholder="e.g. 85.5"
            class={isTouched && validatePercentage(edu.percentage?.toString())
              ? "border-destructive focus-visible:ring-destructive/50"
              : ""}
          />
          {#if isTouched && validatePercentage(edu.percentage?.toString())}<p
              class="text-xs text-destructive"
            >
              {validatePercentage(edu.percentage?.toString())}
            </p>{/if}
        </div>
        <div class="space-y-2">
          <Label>Completion Date <span class="text-destructive">*</span></Label>
          <DatePicker
            bind:value={edu.completed_at}
            class={isTouched && validatePastDate(edu.completed_at)
              ? "border-destructive"
              : ""}
          />
          {#if isTouched && validatePastDate(edu.completed_at)}<p
              class="text-xs text-destructive"
            >
              {validatePastDate(edu.completed_at)}
            </p>{/if}
        </div>
      </div>
    </div>
  {/each}

  <div class="flex items-center justify-between pt-6 border-t border-border">
    <Button variant="outline" onclick={onPrev} disabled={isSubmitting}>
      Previous
    </Button>
    <div class="space-x-2">
      {#if mode !== "view"}
        <Button variant="outline" onclick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          class="bg-hrms-primary text-white hover:bg-hrms-primary/90"
          onclick={() => save()}
          disabled={isSubmitting}
        >
          Save
        </Button>
      {:else}
        <Button onclick={() => onNext()}>Next</Button>
      {/if}
    </div>
  </div>
</div>
