<script lang="ts">
  import { Label, Input, DatePicker, Button, Textarea } from "$lib/components";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import { isDuplicateEntry } from "$lib/utils/employeeValidationHelper";
  import { SvelteDate } from "svelte/reactivity";
  import { parseBackendErrors } from "$lib/utils/errors.js";
  import { onMount } from "svelte";

  let { mode, cuid, onNext, onPrev, onDirtyChange, onCancel } = $props<{
    mode: "create" | "edit";
    cuid: string | null;
    onNext: (cuid?: string) => void;
    onPrev: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onCancel: () => void;
  }>();

  let isSubmitting = $state(false);
  let isTouched = $state(false);

  type ExpItem = {
    company_name: string;
    role: string;
    description: string;
    from_date: string;
    to_date: string;
  };
  const emptyExp = (): ExpItem => ({
    company_name: "",
    role: "",
    description: "",
    from_date: "",
    to_date: "",
  });

  let experiences = $state<ExpItem[]>([]);
  let originalData = $state("[]");

  function addExperience() {
    experiences = [...experiences, emptyExp()];
  }

  function normalizeExpItem(item: Partial<ExpItem>): ExpItem {
    let fromDate = item.from_date || "";
    if (fromDate) {
      fromDate = String(fromDate).split("T")[0];
    }
    let toDate = item.to_date || "";
    if (toDate) {
      toDate = String(toDate).split("T")[0];
    }
    return {
      company_name: item.company_name || "",
      role: item.role || "",
      description: item.description || "",
      from_date: fromDate,
      to_date: toDate,
    };
  }
  function normalizeExperiences(list: Partial<ExpItem>[]): ExpItem[] {
    return (list || []).map(normalizeExpItem);
  }

  onMount(async () => {
    if (cuid) {
      try {
        const res = await fetch(`/api/employees/${cuid}/experiences`, {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const body = await res.json();
        if (res.ok && body.data) {
          experiences = body.data;
        }
      } catch (e) {
        console.error("Failed to fetch experiences", e);
      }
    }
    if (experiences.length === 0) {
      addExperience();
    }
    originalData = JSON.stringify(normalizeExperiences(experiences));
  });

  let isDirty = $derived(
    JSON.stringify(normalizeExperiences(experiences)) !== originalData,
  );

  $effect(() => {
    onDirtyChange?.(isDirty);
  });

  // Validations
  function validateRequired(val: string | undefined | null) {
    return val && val.trim().length > 0 ? "" : "Required";
  }
  function validateDates(from: string, to: string) {
    // Both dates are optional in Prisma
    if (!from && !to) return ""; // both empty is fine
    if (from && !to) return ""; // from without to is fine
    if (!from && to) return ""; // to without from is fine
    const dFrom = new SvelteDate(from);
    const dTo = new SvelteDate(to);
    if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) return "Invalid date.";
    if (dTo > new SvelteDate()) return "To Date cannot be a future date.";
    if (dFrom > dTo) return "From Date cannot be after To Date.";
    return "";
  }

  let hasErrors = $derived(
    experiences.some(
      (e, i) =>
        validateRequired(e.company_name) ||
        validateRequired(e.role) ||
        validateDates(e.from_date, e.to_date) ||
        isDuplicateEntry(experiences, i, (x) => `${x.company_name}|${x.role}`),
    ),
  );

  async function saveOnly(): Promise<{ success: boolean }> {
    isTouched = true;
    if (hasErrors) {
      return { success: false };
    }
    if (!cuid) return { success: false };

    try {
      isSubmitting = true;
      const res = await fetch(`/api/employees/${cuid}/experiences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(experiences),
      });
      if (!res.ok) {
        const body = await res.json();
        const parsed = parseBackendErrors(body);
        throw new Error(parsed.message || "Failed to save experiences");
      }
      originalData = JSON.stringify(normalizeExperiences(experiences));
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
        class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
        onclick={addExperience}
        disabled={isSubmitting}
      >
        Add Experience
      </Button>
    </div>
  {/if}

  {#if experiences.length === 0 && mode === "view"}
    <p class="text-sm text-muted-foreground text-center py-4">
      No experience records found.
    </p>
  {/if}

  {#each experiences as exp, index (index)}
    <div class="rounded-lg border border-border p-4 relative">
      {#if mode !== "view"}
        <div class="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-destructive hover:bg-destructive/10"
            onclick={() =>
              (experiences = experiences.filter((_, i) => i !== index))}
          >
            Delete
          </Button>
        </div>
      {/if}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>Company Name <span class="text-destructive">*</span></Label>
          <Input
            bind:value={exp.company_name}
            placeholder="Company Name"
            class={isTouched &&
            (validateRequired(exp.company_name) ||
              isDuplicateEntry(
                experiences,
                index,
                (x) => `${x.company_name}|${x.role}`,
              ))
              ? "border-destructive focus-visible:ring-destructive/50"
              : ""}
          />
          {#if isTouched && validateRequired(exp.company_name)}<p
              class="text-xs text-destructive"
            >
              {validateRequired(exp.company_name)}
            </p>{/if}
        </div>
        <div class="space-y-2">
          <Label>Role/Designation <span class="text-destructive">*</span></Label
          >
          <Input
            bind:value={exp.role}
            placeholder="e.g. Software Engineer"
            class={isTouched &&
            (validateRequired(exp.role) ||
              isDuplicateEntry(
                experiences,
                index,
                (x) => `${x.company_name}|${x.role}`,
              ))
              ? "border-destructive focus-visible:ring-destructive/50"
              : ""}
          />
          {#if isTouched && validateRequired(exp.role)}<p
              class="text-xs text-destructive"
            >
              {validateRequired(exp.role)}
            </p>{/if}
        </div>
        {#if isTouched && isDuplicateEntry(experiences, index, (x) => `${x.company_name}|${x.role}`)}
          <p class="text-xs text-destructive sm:col-span-2 -mt-2">
            This entry already exists
          </p>
        {/if}
        <div class="space-y-2">
          <Label>From Date <span class="text-destructive">*</span></Label>
          <DatePicker
            bind:value={exp.from_date}
            class={isTouched && validateDates(exp.from_date, exp.to_date)
              ? "border-destructive"
              : ""}
          />
        </div>
        <div class="space-y-2">
          <Label>To Date <span class="text-destructive">*</span></Label>
          <DatePicker
            bind:value={exp.to_date}
            class={isTouched && validateDates(exp.from_date, exp.to_date)
              ? "border-destructive"
              : ""}
          />
          {#if isTouched && validateDates(exp.from_date, exp.to_date)}<p
              class="text-xs text-destructive"
            >
              {validateDates(exp.from_date, exp.to_date)}
            </p>{/if}
        </div>
        <div class="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            bind:value={exp.description}
            placeholder="Key responsibilities and achievements..."
            rows={3}
          />
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
          class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
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
