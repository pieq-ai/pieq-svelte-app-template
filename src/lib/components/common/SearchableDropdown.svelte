<script lang="ts">
  import SearchIcon from "@lucide/svelte/icons/search";
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CheckIcon from "@lucide/svelte/icons/check";

  import { Button, Label } from "$lib/components";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

  import { UI_CONSTANTS } from "$lib/constants";


  export interface DropdownOption {
    id: string;
    label: string;
  }

  interface Props {
    label: string;
    options: DropdownOption[];
    value: string | string[];
    multiple?: boolean;
    placeholder?: string;

    disabled?: boolean;
    class?: string;
    onSelect: (id: string | string[]) => void;
    onAdd?: () => void;
    onEdit?: (id: string) => void;
  }

  let {
    label,
    options,
    value,
    multiple = false,
    placeholder,

    disabled = false,
    class: className = "",
    onSelect,
    onAdd,
    onEdit,
  }: Props = $props();

  let query = $state("");
  let open = $state(false);
  let triggerWidth = $state(0);

  let activePlaceholder = $derived(
    placeholder || `Select ${label.replace(/[*]/g, "").trim()}`,
  );

  let filteredOptions = $derived.by(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  });

  function handleSelect(id: string) {
    if (multiple) {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      if (arr.includes(id)) {
        onSelect(arr.filter((v) => v !== id));
      } else {
        onSelect([...arr, id]);
      }
    } else {
      onSelect(id);
      open = false;
    }
  }

  function selectAll() {
    if (multiple) onSelect(options.map((o) => o.id));
  }

  function deselectAll() {
    if (multiple) onSelect([]);
  }

  let selectedCount = $derived(
    multiple ? (Array.isArray(value) ? value.length : value ? 1 : 0) : 0,
  );

  let displayValue = $derived.by(() => {
    if (multiple) {
      if (selectedCount === 0) return activePlaceholder;
      return `${selectedCount} selected`;
    } else {
      if (!value) return activePlaceholder;
      const singleValue = Array.isArray(value) ? value[0] : value;
      const opt = options.find((o) => o.id === singleValue);
      return opt ? opt.label : activePlaceholder;
    }
  });

  function isSelected(id: string) {
    if (multiple) {
      return Array.isArray(value) ? value.includes(id) : value === id;
    }
    return value === id;
  }
</script>

<div class="space-y-2">
  <Label>
    {#if label.endsWith("*")}
      {label.slice(0, -1).trim()} <span class="text-destructive">*</span>
    {:else}
      {label}
    {/if}
  </Label>
  <div bind:clientWidth={triggerWidth} class="w-full relative">
    <Popover.Root bind:open>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            variant="outline"
            {disabled}
            {...props}
            class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {displayValue ===
            activePlaceholder
              ? 'text-muted-foreground'
              : ''} {className}"
          >
            <span class="truncate block text-left flex-1">{displayValue}</span>
            {#if open}
              <ChevronUpIcon class="ml-2 size-4 shrink-0 opacity-50" />
            {:else}
              <ChevronDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
            {/if}
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content
        style="min-width: {triggerWidth}px; max-width: 90vw;"
        class="p-0 border border-border rounded-md shadow-md bg-popover text-popover-foreground w-auto"
        align="start"
        sideOffset={4}
      >
        <div
          onclick={(e) => e.stopPropagation()}
          onpointerdown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div class="flex items-center border-b px-3">
            <SearchIcon class="mr-2 size-4 shrink-0 opacity-50" />
            <input
              class="flex h-10 w-full border-0 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              bind:value={query}
            />
          </div>
          {#if multiple}
            <div
              class="flex items-center gap-2 p-2 px-3 border-b border-border"
            >
              <Button
                variant="outline"
                size="sm"
                class="h-8 text-xs rounded-md px-3 font-medium bg-background text-foreground focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:border-ring"
                onclick={selectAll}>Select All</Button
              >
              <Button
                variant="outline"
                size="sm"
                class="h-8 text-xs rounded-md px-3 font-medium bg-background text-foreground focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:border-ring"
                onclick={deselectAll}>Deselect All</Button
              >
            </div>
          {/if}
          <ScrollArea class="max-h-60 overflow-y-auto">
            <div class="p-1">
              {#each filteredOptions as option (option.id)}
                <div
                  class="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground group"
                >
                  <button
                    type="button"
                    class="flex-1 flex items-center gap-2 text-left min-w-0"
                    onclick={() => handleSelect(option.id)}
                  >
                    {#if multiple}
                      <div class="pointer-events-none flex items-center">
                        <Checkbox
                          checked={isSelected(option.id)}
                          tabindex={-1}
                        />
                      </div>
                    {:else}
                      <CheckIcon
                        class="size-4 shrink-0 {isSelected(option.id)
                          ? 'opacity-100 text-[#F45310]'
                          : 'opacity-0'}"
                      />
                    {/if}
                    <span
                      class={isSelected(option.id) && !multiple
                        ? "font-medium text-[#F45310]"
                        : ""}
                      style="word-break: break-word;"
                    >
                      {option.label}
                    </span>
                  </button>
                  {#if onEdit}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      class="opacity-0 group-hover:opacity-100 h-6 ml-2 shrink-0"
                      aria-label={`Edit ${option.label}`}
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation();
                        onEdit!(option.id);
                      }}
                    >
                      Edit
                    </Button>
                  {/if}
                </div>
              {:else}
                <div
                  class="flex items-center justify-center py-8 text-sm text-muted-foreground text-center min-h-[100px]"
                >
                  {UI_CONSTANTS.EMPTY_STATE_MESSAGE || "No results found."}
                </div>
              {/each}
            </div>
          </ScrollArea>
          {#if onAdd}
            <div class="p-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                class="w-full justify-center text-sm font-medium text-foreground bg-background hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:border-ring"
                onclick={() => {
                  open = false;
                  onAdd!();
                }}
              >
                Add {label.replace(/[*]/g, "").trim()}
              </Button>
            </div>
          {/if}
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>
</div>
