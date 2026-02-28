---
name: add-ent
description: add a new ent, hook, schema, and parser to the void engine or a void app.
---

# Add a New Ent

`rotate` (app ent, `src/demo/`) and `cursor` (engine ent, `src/engine/`) are good examples.

**1. add the JSON Schema definition.** add a `$defs` entry and reference it from `Ent.properties` in `<app>/level/schema.json` / `schema/level-file.v0.json`.  this is the data needed to populate a new ent instance by the level editor. it should have good defaults and be friendly. `unevaluatedProperties: false` goes at the composition site (where `$ref` appears), not inside the `$def` itself.

```json
{
  "$defs": {
    "Rotate": {
      "type": "object",
      "description": "rotate config.",
      "required": ["speed"],
      "properties": {
        "speed": {"type": "number", "description": "degrees per second."}
      }
    },
    "Ent": {
      "allOf": [
        {"$ref": "level-file.v0.json#/$defs/Ent"},
        {
          "type": "object",
          "properties": {
            "rotate": {"$ref": "#/$defs/Rotate", "unevaluatedProperties": false}
          }
        }
      ]
    }
  }
}
```

**2. derive the ent schema TypeScript type.** create the TypeScript ent schema `type` from the JSON Schema defintion and add to `<app>/level/level-schema.ts` / `engine/level/level-schema.ts`:

```ts
export type RotateSchema = {speed: number}
```

app ents are composed in `EntSchema` with a declaration merge in `<app>/types/decl.ts` as an optional prop:

```ts
import type {RotateSchema} from '../level/level-schema.ts'

declare module '@oidoid/void' {
  interface EntSchema { rotate?: RotateSchema }
}
```

engine ents are added directly to `EntSchema`:

```ts
export interface EntSchema {
  cursor?: CursorSchema
}
```

**3. define the ent data type.** create the type generated from parsing the ent schema which may be the same or quite different and may use any parse time dependencies to construct. prefer records to classes. add a type to `<app>/ents/ent.ts` / `engine/ents/ent.ts`:

```ts
// use `object` for marker ents with no runtime data.
export type Rotate = {speed: number}
```

app ents are composed in `Ent` with a declaration merge in `<app>/types/decl.ts` as an optional prop:

```ts
declare module '@oidoid/void' {
  interface Ent { rotate?: Rotate }
}
```

engine ents are added directly to `Ent`:

```ts
export interface Ent {
  cursor?: Cursor
}
```

**4. add the ent type alias.** derive the narrowed ent type with `HookEnt`:

```ts
export type RotateEnt = V.HookEnt<RotateHook>
```

for composable data-only ents with no dedicated hook, use `QueryEnt<'key'>` instead:

```ts
export type TextEnt = QueryEnt<'text'>
```

**5. (optional) create the hook.** add a class that implements `Hook` in `<app>/ents/<prop>.ts` / in `engine/ents/<prop>.ts`. the `query` describes the minimum ent props needed to run; all other `Ent` props are optional. prefer ent instance state to hook state as there is only one hook instance.

```ts
import type * as V from '@oidoid/void'

export class RotateHook implements V.Hook {
  readonly query = 'rotate & sprite'

  update(ent: RotateEnt, v: V.Void): void {
    ent.sprite.angle += ent.rotate.speed * v.tick.s
    ent.invalid = true
  }
}
```

avoid exposing behavior outside of `<prop>.ts`. if necessary, consider the API pattern of `TextEnt` in `engine/ents/text.ts`:

```ts
export function textSetText(ent: TextEnt, str: string): void {
  if (str === ent.text) return // avoid mutation!
  ent.text = str
  ent.invalid = true // mutations always set invalid!
}
```

`update()` should mark modified ents with `ent.invalid = true` to require a redraw. avoid redraws.

**6. add the parser.** add a new `parse<Prop>()` function to `<app>/level/level-parser.ts` / `engine/level/level-parser.ts`:

```ts
import * as V from '../../engine/index.ts'

export const parseEntProp: V.EntPropParser = (ent, json, k) => {
  if (json[k] == null) return
  switch (k) {
    case 'cursor':
      // every case tests return type with `satisfies V.Ent[typeof k]`.
      return parseCursor(ent, json[k]) satisfies V.Ent[typeof k]
  }
}

export function parseCursor(ent: Ent, json: Readonly<CursorSchema>): Cursor {
  if (!ent.sprite) throw Error('cursor missing sprite')
  ent.sprite.hidden = true
  return {
    bounds: {x: 0, y: 0, w: 0, h: 0},
    keyboard: json.keyboard ?? 0,
    pick: json.pick,
    point: ent.sprite.tag
  }
}
```

ents are parsed first by any app `EntPropParser` override then any engine implementation. props are parsed in key order.

**7. register the hook.** add the hook in the loader's `HookMap` in `<app>/level/loader.ts`:

```ts
readonly #hooks: Readonly<V.HookMap> = {
  cursor: new V.CursorHook(),
  rotate: new RotateHook(),
}
```

limit hooks to those used as they cost bundle size.

**8. add ent instances to the level file.** add an ent instance to a zoo list in `*.level.jsonc` composing whatever props are wanted:

```jsonc
{
  "id": "cursor",
  "sprite": "cursor--Pointer",
  "cursor": {},
  "rotate": {"speed": 90}
}
```

lists then ents then props are typically updated in insertion order. strongly avoid varying order. the debug input, cam, and cursor _ents_ should appear first. draw should appear last. the recommended prop order is defined in [readme.md](../../../readme.md#order).
