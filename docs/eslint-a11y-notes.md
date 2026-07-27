# Why some `jsx-a11y` rules are disabled

`.eslintrc.json` cannot carry comments, so the reasoning lives here. Each of
these is switched off deliberately, not to silence noise.

## `jsx-a11y/no-redundant-roles`

We write `<ul role="list">` throughout. The role looks redundant because a `<ul>`
already has it — but Tailwind's preflight sets `list-style: none`, and Safari
with VoiceOver **drops list semantics entirely** from a list with no marker.
Re-declaring the role restores them. This is a well-known workaround, and the
rule has no way to know our reset removes the markers.

## `jsx-a11y/click-events-have-key-events`, `no-static-element-interactions`, `no-noninteractive-element-interactions`

Two places legitimately put a click handler on a non-focusable element:

- **Modal backdrops** (`Dialog`, `Sheet`). Click-outside-to-dismiss is a
  convenience that duplicates two keyboard-reachable affordances — the Escape
  key and the close button. The backdrop is `aria-hidden`, so exposing it as its
  own control would add a meaningless stop to the tab order.
- **Command palette rows.** These are `role="option"` inside a `role="listbox"`
  driven by a `role="combobox"` input. In that pattern the *input* keeps focus
  and moves `aria-activedescendant`; making each option separately focusable
  would break the pattern rather than improve it.

## `jsx-a11y/interactive-supports-focus` (disabled inline in `Tabs.tsx` only)

The ARIA authoring practices specify that a `tablist` is **not** focusable — its
tabs are, via a roving `tabindex`. The `onKeyDown` on the container is event
delegation from whichever tab currently has focus. Adding `tabIndex` to satisfy
the rule would introduce an extra, useless tab stop.

Everything else in the recommended set is enforced.
