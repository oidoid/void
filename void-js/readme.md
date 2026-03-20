# void

void is a simple 2D engine for games and toy applications featuring:
- good typing.
- easy scripting in little code.
- fast loading.
- few dependencies.
- selective redraw for low energy idle.
- compilation to a single standalone HTML file.
- text, nine-patch, and button primitives for basic UI.
- DOM compatibility.

## Installation

```
npm install --save @oidoid/void
```

### Native Dependencies

- Aseprite
- cwebp

## Development

### Local Development

1. clone void as a sibling directory of the app.
2. `npm link ../void` from the app.
3. add `customConditions` to the root `tsconfig` for esbuild and a void reference for tsc. Eg:

```jsonc
{
  "extends": "./tsconfig.prod.json",
  "compilerOptions": {
    "customConditions": ["dev"],
  },
  "references": [{"path": "../void"}]
}
```

  it's possible to use `"paths": {"@oidoid/void": ["../void/src"]}` instead of or in addition to `customConditions`.
4. for unit tests, run with `NODE_OPTIONS=--conditions=dev`.

### Declaration Merging

to avoid threading template parameters throughout all code, declaration merging is used for the following:

- `AnimData`
- `AtlasMap`
- `CamConfig`
- `CamConfigSchema`
- `Debug`
- `Ent`
- `EntSchema`
- `Hook`
- `Loader`
- `PoolMap`
- `ReturnTag`
- `ReturnTile`
- `Zoo`

it's similar to modifying `HTMLElementTagNameMap`.

### Ents

populating the world usually requires defining a new ent (data type), a hook (behavior on data), a schema (level data format), and a parser (schema to ent transform). hooks are executed on ent lists ("zoos") in level loaders.

ents are plain, nonnullish, key-value (props) data that describe app entities.

`Ent` is a superset of all possible key-values. use declaration merging to type. all other ents are subsets. eg, `CursorEnt` is `{cursor: Cursor, sprite: Sprite}`.

`SpriteEnt` is kind of a base game object that is drawable, describes bounds, and provides collision detection. if the ent should have no visual representation, leave the sprite as hidden.

the special `Ent.invalid` field is a frame timestamp that may flag whether a hook should update and controls whether the screen should be redrawn (which is high energy). redrawing is necessary for animations but often not for static apps.

#### Hooks

hooks are classes that process ents and usually pair to a specific ent. they're passed ents matching their query. eg, `CursorHook` requires at least the `CursorEnt` subset. prefer ent state to hook state. dataless behaviors use a empty `object` marker prop.

#### Queries

queries declare props required on an ent by a hook. syntax: `[!]<key>[ & | <query>]`, no grouping. eg `'button & fullscreenToggle & sprite'`.

#### Order

lists then ents then props are typically updated in insertion order. strongly avoid varying order. the debug input, cam, and cursor _ents_ should appear first. draw should appear last. the recommended prop order is:

- `debugInput`
- `debugLoseContextButton`
- `cam`
- `id`
- `name`
- `text`
- `sprite`
- `textWH`
- `cursor`
- `hud`
- `anchor`
- `ninePatch`
- `button`
- `textXY`
- `fps`
- `fullscreenToggle`
- `invalid`
- `override`
- `draw`

eg, if a new prop `randomText` changes the `text` field, it should appear before `textWH` which sizes to the text.

`anchor` positions an ent relative to another ent by ID. because ents are updated in insertion order, the target ent must appear **before** the anchored ent in the zoo list, otherwise the anchored ent reads a stale position for that frame.

hooks are uniquely associated with a key. zero or one hook per key. if multiple keys on an ent are associated with a hook, it will be run multiple times per update.

#### Invalid

`Ent.invalid` is a frame timestamp. ents should prefer to write `v.tick.start` after mutating to flag rendering and recompute by downstream hooks. use `Infinity` when creating an ent. use `Infinity` to force recompute every frame and `0` to suppress. ents may read another ent's `invalid` to test if it was updated in the current frame (`const updated = ref.invalid >= v.tick.start`). this enables dependent ents like `anchor` to only update when their target moved that frame.

### Schema

there are two schemas: a app configuration (`void.json`) and level configs (`*.level.jsonc`). the parser assumes a valid schema to minimize code size.

levels are described with the level schema. some schema props may only be applied at parse time.

there's no runtime validation.

### Testing

an example of a playwright test that takes a screenshot and verifies no console logs:

```ts
import { expect, test } from '@playwright/test'

const logs: string[] = []

test.beforeEach(async ({ page }) => {
  logs.length = 0;
  await page.addInitScript(() => {
    addEventListener('error', (ev) =>
      console.error(`[window.error] ${ev.error instanceof Error ? ev.error.  message : ev.error}`)
    )
    addEventListener('unhandledrejection', (ev) =>
      console.error(`[window.unhandledrejection] ${ev.reason instanceof Error ?   ev.reason.message : ev.reason}`)
    )
  })
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
})

test.afterEach(async ({ page }) => {
  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  expect(logs, logs.join('\n')).toStrictEqual([])
})

test('test', async ({page}) => {
  await page.goto('http://localhost:1234/')
  await page.locator('canvas').click({position: {x: 123, y: 456}})
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page).toHaveScreenshot('load.png', {maxDiffPixelRatio: .01})
})

function onConsole(msg: { type(): string; text(): string }) {
  if (msg.type() === 'debug') return
  logs.push(`[console.${msg.type()}] ${msg.text()}`)
}

function onPageError(err: unknown) {
  logs.push(`[pageerror] ${String(err instanceof Error ? err.stack || err.  message : err)}`)
}
```

### Project Layout

- `schema/`: JSON Schemas for all apps.
- `src/engine/`: game engine and runtime APIs.
- `src/cli/`: `void` command line interface for building void apps.
- `src/demo/`: engine demonstration.
- `src/tv/`: level editor.
- `src/test/`: shared test utils.

## tv

tv is a placeholder for a basic tile and ent editor.
