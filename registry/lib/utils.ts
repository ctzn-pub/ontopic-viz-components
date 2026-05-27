// Canonical `cn` shim. The shadcn-style UI components in `registry/ui/*` import
// `{ cn } from "../lib/utils"` (a sibling `lib/utils`). The `viz add` CLI
// materializes this file as `viz/lib/utils.ts` in the consumer. Keeping it here
// as the single source of truth lets the registry typecheck and gives the CLI a
// real file to copy instead of an inline string.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
