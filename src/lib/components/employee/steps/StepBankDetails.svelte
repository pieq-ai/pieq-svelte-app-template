<script lang="ts">
  import { Label, Input, Button, CrudModal, Checkbox } from "$lib/components";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import { parseBackendErrors } from "$lib/utils/errors.js";
  import { onMount } from "svelte";
  import {
    validatePersonal,
    validateEmployment,
    validateAddresses,
    validateEducations,
    validateExperiences,
    validateSkills,
    validateLanguages,
    validateDocuments,
    validateBankDetails,
    isDuplicateEntry,
  } from "$lib/utils/employeeValidationHelper";

  let { mode, cuid, onPrev, onDirtyChange, onCancel } = $props<{
    mode: "create" | "edit";
    cuid: string | null;
    onPrev: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    onCancel: () => void;
  }>();

  let isSubmitting = $state(false);
  let isTouched = $state(false);
  let isValidating = $state(false);
  let showValidationModal = $state(false);
  let validationErrors = $state<{ section: string; errors: string[] }[]>([]);

  interface BankDetailsItem {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    branch_name: string;
    ifsc_code: string;
    is_primary: boolean;
  }

  let bankDetails = $state<BankDetailsItem[]>([]);
  let originalData = $state("[]");

  function addBank() {
    bankDetails = [
      ...bankDetails,
      {
        account_holder_name: "",
        account_number: "",
        bank_name: "",
        branch_name: "",
        ifsc_code: "",
        is_primary: false,
      },
    ];
  }

  function normalizeBankItem(item: Partial<BankDetailsItem>) {
    return {
      account_holder_name: item.account_holder_name || "",
      account_number: item.account_number || "",
      bank_name: item.bank_name || "",
      branch_name: item.branch_name || "",
      ifsc_code: (item.ifsc_code || "").toUpperCase().trim(),
      is_primary: !!item.is_primary,
    };
  }
  function normalizeBankDetails(list: Partial<BankDetailsItem>[]) {
    return (list || []).map(normalizeBankItem);
  }

  onMount(async () => {
    if (cuid) {
      try {
        const res = await fetch(`/api/employees/${cuid}/bank-details`, {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const body = await res.json();
        if (res.ok && body.data) {
          bankDetails = body.data;
        }
      } catch (e) {
        console.error("Failed to fetch bank details", e);
      }
    }
    if (bankDetails.length === 0) {
      addBank();
    }
    originalData = JSON.stringify(normalizeBankDetails(bankDetails));
  });

  let isDirty = $derived(
    JSON.stringify(normalizeBankDetails(bankDetails)) !== originalData,
  );

  $effect(() => {
    onDirtyChange?.(isDirty);
  });

  // Validations
  function validateRequired(val: string | undefined | null) {
    return val && val.trim().length > 0 ? "" : "Required";
  }
  function validateIfsc(val: string | undefined | null) {
    if (!val) return "Required";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(val))
      return "Invalid IFSC (e.g. SBIN0123456)";
    return "";
  }

  let hasErrors = $derived(
    bankDetails.some(
      (b, i) =>
        validateRequired(b.account_holder_name) ||
        validateRequired(b.account_number) ||
        validateRequired(b.bank_name) ||
        validateIfsc(b.ifsc_code) ||
        isDuplicateEntry(
          bankDetails,
          i,
          (x) => `${x.ifsc_code}|${x.account_number}`,
        ),
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
      const res = await fetch(`/api/employees/${cuid}/bank-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankDetails),
      });
      if (!res.ok) {
        const body = await res.json();
        const parsed = parseBackendErrors(body);
        throw new Error(parsed.message || "Failed to save bank details");
      }

      originalData = JSON.stringify(normalizeBankDetails(bankDetails));
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
    toast.success(
      mode === "create"
        ? "Employee created successfully"
        : "Changes saved successfully",
    );
    $globalIsDirty = false;
    goto("/employees");
  }
</script>

<div class="space-y-4 -mt-6">
  {#if mode !== "view"}
    <div class="flex justify-end">
      <Button
        class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
        onclick={addBank}
        disabled={isSubmitting}
      >
        Add Bank
      </Button>
    </div>
  {/if}

  {#if bankDetails.length === 0 && mode === "view"}
    <p class="text-sm text-muted-foreground text-center py-4">
      No bank details recorded.
    </p>
  {/if}

  <div class="space-y-4">
    {#each bankDetails as bank, index (index)}
      <div class="rounded-lg border border-border p-4 pt-10 relative">
        {#if mode !== "view"}
          <Button
            variant="ghost"
            size="sm"
            class="absolute right-2 top-2 text-destructive hover:bg-destructive/10"
            onclick={() =>
              (bankDetails = bankDetails.filter((_, i) => i !== index))}
          >
            Delete
          </Button>
        {/if}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>Bank Name <span class="text-destructive">*</span></Label>
            <Input
              bind:value={bank.bank_name}
              placeholder="e.g. Chase Bank"
              class={isTouched && validateRequired(bank.bank_name)
                ? "border-destructive focus-visible:ring-destructive/50"
                : ""}
              required
            />
            {#if isTouched && validateRequired(bank.bank_name)}<p
                class="text-xs text-destructive"
              >
                {validateRequired(bank.bank_name)}
              </p>{/if}
          </div>
          <div class="space-y-2">
            <Label>Branch Name</Label>
            <Input
              bind:value={bank.branch_name}
              placeholder="Downtown Branch"
            />
          </div>
          <div class="space-y-2">
            <Label
              >Account Holder Name <span class="text-destructive">*</span
              ></Label
            >
            <Input
              bind:value={bank.account_holder_name}
              placeholder="John Doe"
              class={isTouched && validateRequired(bank.account_holder_name)
                ? "border-destructive focus-visible:ring-destructive/50"
                : ""}
              required
            />
            {#if isTouched && validateRequired(bank.account_holder_name)}<p
                class="text-xs text-destructive"
              >
                {validateRequired(bank.account_holder_name)}
              </p>{/if}
          </div>
          <div class="space-y-2">
            <Label>Account Number <span class="text-destructive">*</span></Label
            >
            <Input
              bind:value={bank.account_number}
              placeholder="000123456789"
              class={isTouched &&
              (validateRequired(bank.account_number) ||
                isDuplicateEntry(
                  bankDetails,
                  index,
                  (x) => `${x.ifsc_code}|${x.account_number}`,
                ))
                ? "border-destructive focus-visible:ring-destructive/50"
                : ""}
              required
            />
            {#if isTouched && validateRequired(bank.account_number)}<p
                class="text-xs text-destructive"
              >
                {validateRequired(bank.account_number)}
              </p>{/if}
          </div>
          <div class="space-y-2">
            <Label
              >Routing / IFSC Code <span class="text-destructive">*</span
              ></Label
            >
            <Input
              bind:value={bank.ifsc_code}
              oninput={(e) =>
                (bank.ifsc_code = e.currentTarget.value.toUpperCase())}
              placeholder="IFSC/Routing"
              class={isTouched &&
              (validateIfsc(bank.ifsc_code) ||
                isDuplicateEntry(
                  bankDetails,
                  index,
                  (x) => `${x.ifsc_code}|${x.account_number}`,
                ))
                ? "border-destructive focus-visible:ring-destructive/50"
                : ""}
              required
            />
            {#if isTouched && validateIfsc(bank.ifsc_code)}<p
                class="text-xs text-destructive"
              >
                {validateIfsc(bank.ifsc_code)}
              </p>{/if}
          </div>
          {#if isTouched && isDuplicateEntry(bankDetails, index, (x) => `${x.ifsc_code}|${x.account_number}`)}
            <p
              class="text-xs text-destructive sm:col-span-2 md:col-span-3 -mt-2"
            >
              This bank account (IFSC + Account Number) already exists.
            </p>
          {/if}
          <div class="space-y-2 flex items-end pb-2">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={bank.is_primary}
                onCheckedChange={(v) => {
                  if (v) {
                    bankDetails = bankDetails.map((b, i) =>
                      i === index
                        ? { ...b, is_primary: true }
                        : { ...b, is_primary: false },
                    );
                  } else {
                    bank.is_primary = false;
                  }
                }}
              /> Primary Account
            </label>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="flex items-center justify-between pt-6 border-t border-border">
    <Button
      variant="outline"
      onclick={onPrev}
      disabled={isSubmitting || isValidating}
    >
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
        <!-- View mode buttons if needed -->
      {/if}
    </div>
  </div>
</div>
