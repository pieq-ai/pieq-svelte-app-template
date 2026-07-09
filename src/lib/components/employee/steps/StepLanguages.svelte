<script lang="ts">
  import {
    Button,
    MasterDataDropdown,
    SearchableDropdown,
    Checkbox,
  } from "$lib/components";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import { parseBackendErrors } from "$lib/utils/errors.js";
  import { onMount, getContext } from "svelte";
  import { EMPLOYEE_API_CONTEXT, type EmployeeApiClient } from '../context';

  let { mode, cuid, onNext, onPrev, onDirtyChange, onCancel } = $props<{
    mode: "create" | "edit";
    cuid: string | null;
    onNext: (cuid?: string) => void;
    onPrev: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onCancel: () => void;
  }>();

  let apiClient = getContext<() => EmployeeApiClient>(EMPLOYEE_API_CONTEXT)();

  let isSubmitting = $state(false);
  let isTouched = $state(false);
  let backendErrors = $state<Record<string, string>>({});

  type LangItem = {
    language_cuid: string;
    proficiency_level: string;
    can_read: boolean;
    can_write: boolean;
    can_speak: boolean;
  };
  const emptyLang = (): LangItem => ({
    language_cuid: "",
    proficiency_level: "",
    can_read: false,
    can_write: false,
    can_speak: false,
  });

  let languages = $state<LangItem[]>([]);
  let originalData = $state("[]");

  function addLanguage() {
    languages = [...languages, emptyLang()];
  }

  function normalizeLangItem(item: Partial<LangItem>): LangItem {
    return {
      language_cuid: item.language_cuid || "",
      proficiency_level: item.proficiency_level || "",
      can_read: item.can_read ?? false,
      can_write: item.can_write ?? false,
      can_speak: item.can_speak ?? false,
    };
  }
  function normalizeLanguages(list: Partial<LangItem>[]): LangItem[] {
    return (list || []).map(normalizeLangItem);
  }

  onMount(async () => {
    if (cuid || apiClient.mode === 'self') {
      try {
        const res = await fetch(apiClient.getBaseUrl('languages'), {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const body = await res.json();
        if (res.ok && body.data) {
          languages = body.data;
        }
      } catch (e) {
        console.error("Failed to fetch languages", e);
      }
    }
    if (languages.length === 0) {
      addLanguage();
    }
    originalData = JSON.stringify(normalizeLanguages(languages));
  });

  let isDirty = $derived(
    JSON.stringify(normalizeLanguages(languages)) !== originalData,
  );
  
  $effect(() => {
    onDirtyChange?.(isDirty);
  });

  // Validations
  function validateRequired(val: string | undefined | null) {
    return val && val.trim().length > 0 ? "" : "Required";
  }

  let hasErrors = $derived(
    languages.some(
      (l) =>
        validateRequired(l.language_cuid) ||
        validateRequired(l.proficiency_level),
    ),
  );

  let isSaveDisabled = $derived(isSubmitting || hasErrors || (mode === 'edit' && !isDirty));
	async function saveOnly(): Promise<{ success: boolean }> {
    isTouched = true;
    backendErrors = {};
    if (hasErrors) {
      return { success: false };
    }
    if (!cuid) return { success: false };
    if (mode === 'edit' && !isDirty) return { success: true };

    try {
      isSubmitting = true;
      const res = await fetch(apiClient.getBaseUrl('languages'), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(languages),
      });
      if (!res.ok) {
        const body = await res.json();
        const parsed = parseBackendErrors(body);
        if (parsed.field) {
          backendErrors = { [parsed.field]: parsed.message };
        } else {
          toast.error(parsed.message || "Failed to save languages");
        }
        return { success: false };
      }
      originalData = JSON.stringify(normalizeLanguages(languages));
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
        onclick={addLanguage}
        disabled={isSubmitting}
      >
        Add Language
      </Button>
    </div>
  {/if}

  {#if languages.length === 0 && mode === "view"}
    <p class="text-sm text-muted-foreground text-center py-4">
      No languages recorded.
    </p>
  {/if}

  <div class="space-y-4">
    {#each languages as lang, index (index)}
      <div class="flex flex-col gap-4 p-4 border border-border rounded-lg">
        {#if mode !== "view"}
          <div class="flex justify-end -mb-2">
            <Button
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-destructive hover:bg-destructive/10"
              onclick={() =>
                (languages = languages.filter((_, i) => i !== index))}
            >
              Delete
            </Button>
          </div>
        {/if}
        <div
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full"
        >
          <div class="flex-1 w-full sm:pr-8">
            <MasterDataDropdown
              master="languages"
              label="Language *"
              value={lang.language_cuid}
              onSelect={(val) => (lang.language_cuid = val as string)}
              disabled={mode === "view"}
              class={isTouched && validateRequired(lang.language_cuid) ? "border-destructive" : ""}
            />
            {#if isTouched && validateRequired(lang.language_cuid)}<p
                class="text-xs text-destructive mt-1"
              >
                {validateRequired(lang.language_cuid)}
              </p>{/if}
            {#if backendErrors.root}
              <p class="text-xs text-destructive mt-1">{backendErrors.root}</p>
            {/if}
          </div>
          <div class="flex-1 w-full">
            <SearchableDropdown
              label="Proficiency *"
              value={lang.proficiency_level}
              options={[
                { id: "beginner", label: "Beginner" },
                { id: "intermediate", label: "Intermediate" },
                { id: "fluent", label: "Fluent" },
              ]}
              onSelect={(val) => (lang.proficiency_level = val as string)}
              disabled={mode === "view"}
              class={isTouched && validateRequired(lang.proficiency_level) ? "border-destructive" : ""}
            />
            {#if isTouched && validateRequired(lang.proficiency_level)}
              <p class="text-xs text-destructive mt-1">Required</p>
            {/if}
          </div>
        </div>
        <div class="flex gap-6 mt-2">
          <label class="flex items-center gap-2 text-sm cursor-pointer"
            ><Checkbox bind:checked={lang.can_read} /> Read</label
          >
          <label class="flex items-center gap-2 text-sm cursor-pointer"
            ><Checkbox bind:checked={lang.can_write} /> Write</label
          >
          <label class="flex items-center gap-2 text-sm cursor-pointer"
            ><Checkbox bind:checked={lang.can_speak} /> Speak</label
          >
        </div>
      </div>
    {/each}
  </div>

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
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      {:else}
        <Button onclick={() => onNext()}>Next</Button>
      {/if}
    </div>
  </div>
</div>
