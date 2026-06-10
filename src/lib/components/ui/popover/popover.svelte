<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	let { ...props }: PopoverPrimitive.RootProps = $props();
</script>

<PopoverPrimitive.Root {...props} />
