import type { VariantProps } from "tailwind-variants";
import Root, { alertVariants } from "./alert.svelte";
import Description from "./alert-description.svelte";
import Title from "./alert-title.svelte";
import Action from "./alert-action.svelte";

export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
export { alertVariants };

export {
	Root,
	Description,
	Title,
	Action,
	//
	Root as Alert,
	Description as AlertDescription,
	Title as AlertTitle,
	Action as AlertAction,
};

