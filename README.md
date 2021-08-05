# svelte-preprocess-inline-logic

Write logic blocks inline on the element, like Vue.

```svelte
<div :if={foo}>
  Hello
</div>
<div :else-if={bar}>
  World
</div>
<div :else>
  !
</div>
```

See [Input.svelte](./Input.svelte) for the full supported syntax.

## Status

**Experimental**. The code is really messy and only serves as an MVP of what the Svelte syntax could be.

Unresolved issues:

1. Parser assumes attributes are written correctly. Needs a validator to do a pre-pass and provide helpful error messages.
2. Incorrect generated sourcemaps. The special keyword values aren't properly moved to the transformed code. For example, the transformed `{#if foo}` won't be mapped to `:if={foo}`.
3. Intellisense barfs like there's no tomorrow.
4. Unspecced and not fully tested.

## Development

Run `node test` to preprocess `Input.svelte` to `Output.svelte`.

## License

MIT
