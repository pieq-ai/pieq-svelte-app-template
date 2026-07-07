import type { VariantProps } from "tailwind-variants";
import { badgeVariants } from "./badge.svelte";
export { default as Badge } from "./badge.svelte";
export { badgeVariants };
export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
