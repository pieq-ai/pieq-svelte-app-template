import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { VariantProps } from "tailwind-variants";
import { type WithElementRef } from "$lib/utils.js";
import Root, { buttonVariants } from "./button.svelte";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

type ButtonProps = WithElementRef<HTMLButtonAttributes> &
	WithElementRef<HTMLAnchorAttributes> & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	};

export {
	Root,
	type ButtonProps as Props,
	Root as Button,
	buttonVariants,
	type ButtonProps,
	type ButtonSize,
	type ButtonVariant,
};

