<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade, scale } from "svelte/transition";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, Alert, AlertDescription } from "$lib/components";

  let {
    isOpen = false,
    title = "Master Form",
    isSubmitting = false,
    canSave = true,
    errorMessage = "",
    onclose,
    onsubmit,
    children,
  }: {
    isOpen: boolean;
    title: string;
    isSubmitting?: boolean;
    canSave?: boolean;
    errorMessage?: string;
    onclose: () => void;
    onsubmit: (e: SubmitEvent) => void | Promise<void>;
    children: Snippet;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop: role="presentation" satisfies a11y — it is purely visual, keyboard is handled via svelte:window onkeydown -->
  <div
    role="presentation"
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[3px] transition-all"
    onclick={onclose}
  >
    <!-- Modal Content Box -->
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      transition:scale={{ start: 0.96, duration: 150 }}
      class="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div
        class="flex items-center border-b border-border px-6 py-4 bg-muted/50"
      >
        <h3
          id="modal-title"
          class="text-lg font-bold text-foreground tracking-tight pr-12"
        >
          {title}
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          class="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-full h-8 w-8 hover:bg-accent transition-all duration-200 z-10 flex items-center justify-center"
          onclick={onclose}
          aria-label="Close modal"
        >
          <XIcon class="size-4" />
        </Button>
      </div>

      <!-- Form -->
      <form {onsubmit} class="flex flex-col">
        <div class="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {#if errorMessage}
            <Alert
              variant="destructive"
              class="border-destructive/30 bg-destructive/5 text-destructive"
            >
              <AlertDescription class="font-medium"
                >{errorMessage}</AlertDescription
              >
            </Alert>
          {/if}

          {@render children()}
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/50"
        >
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onclick={onclose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            class="bg-hrms-primary text-white hover:bg-hrms-primary-dark border-0 shadow-sm shadow-primary/10"
            disabled={isSubmitting || !canSave}
          >
            {#if isSubmitting}
              <LoaderCircleIcon class="mr-1.5 size-4 animate-spin" />
              Saving...
            {:else}
              Save Changes
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
