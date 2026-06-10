import { Popover as PopoverPrimitive } from "bits-ui";

const Root = PopoverPrimitive.Root;
const Trigger = PopoverPrimitive.Trigger;
const Close = PopoverPrimitive.Close;

export {
	Root,
	Trigger,
	Close,
	Root as Popover,
	Trigger as PopoverTrigger,
	Close as PopoverClose
};
export { default as Content, default as PopoverContent } from "./popover-content.svelte";
