<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	let { open = $bindable(), ...props }: PopoverPrimitive.RootProps = $props();
</script>

<PopoverPrimitive.Root bind:open {...props} />
