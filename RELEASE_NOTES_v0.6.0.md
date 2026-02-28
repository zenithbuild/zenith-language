# @zenithbuild/language v0.6.0

## Summary

- Grammar highlights canonical primitives (zenMount, zenWindow, zenDocument, zenOn, zenResize, collectRefs, signal, ref)
- `on:event` canonical; `@click` and `onclick` scoped as legacy
- Snippets for state, signal, ref, zenMount, zenOn, zenResize, collectRefs, on:click
- `zenith.strictDomLints` setting added

## Breaking Changes

None.

## Key Changes

- **Grammar:** `on:click={handler}` highlighted as canonical; `{handler}` as TypeScript identifier
- **Grammar:** Legacy `@click` and `onclick` use `meta.attribute.event.legacy.zenith` scope
- **Snippets:** state toggle, signal counter, ref dom, zenMount cleanup, zenEffect, zenWindow, zenOn keydown escape, zenResize viewport, collectRefs, on:click
- **Config:** `zenith.strictDomLints` (boolean, default false)
- **Embedded:** `source.ts.embedded.zenith` mapped to TypeScript for expression highlighting

## Verification Checklist

- [ ] `on:click={handler}` highlights `handler` as TS identifier
- [ ] `@click` and `onclick` use legacy scope (different color if theme supports it)
- [ ] Snippets expand correctly; no querySelector/addEventListener patterns
