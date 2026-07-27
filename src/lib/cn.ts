/**
 * Conditional class-name join.
 *
 * The whole of `clsx` that this codebase actually uses, in one line. There is
 * deliberately no `tailwind-merge` companion: variant classes in
 * `src/components/ui/*` are defined as mutually exclusive lookup records, so
 * conflicting utilities never reach the same element and there is nothing to
 * de-duplicate at runtime.
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
