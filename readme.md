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

1. clone void as a sibling directory of the game.
2. `npm link ../void` from the game.
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
- `CamSchema`
- `CamUpdater`
- `Debug`
- `Draw`
- `DrawSchema`
- `Ent`
- `EntSchema`
- `Hook`
- `LevelZoo`
- `Loader`
- `PoolMap`
- `ReturnTag`
- `ReturnTile`

it's similar to modifying `HTMLElementTagNameMap`.

### Ents

populating the world usually requires defining a new ent (data type), a hook (behavior on data), a schema (level data format), and a parser (schema to ent transform). hooks are executed on ent lists ("zoos") in level loaders.

ents are plain, nonnullish, key-value data that describe game entities.

`Ent` is a superset of all possible key-values. use declaration merging to type. all other ents are subsets. eg, `CursorEnt` is `{cursor: Cursor, sprite: Sprite}`.

`SpriteEnt` is kind of a base game object that is drawable, describes bounds, and provides collision detection. if the ent should have no visual representation, leave the sprite as hidden.

the special `Ent.invalid` field flags whether the screen should be redrawn (which is high energy) and possibly when the hook should update. redrawing is necessary for animations but often not for static apps.

#### Hooks

hooks are classes that process ents and usually pair to a specific ent. they're passed ents matching their query. eg, `CursorHook` requires at least the `CursorEnt` subset.

#### Queries

queries declare props required on an ent by a hook.

#### Order

lists then ents are typically updated in insertion order. the cam and then cursor _ents_ should appear first.

components are parsed and updated in key order. the recommended order is:

- `debugInput`
- `id`
- `name`
- `text`
- `sprite`
- `textWH`
- `cursor`
- `hud`
- `ninePatch`
- `button`
- `textXY`
- `invalid`
- `override`

hooks are uniquely associated with a key. zero or one hook per key. if multiple keys on an ent are associated with a hook, it will be run multiple times per update.

#### Invalid

ents and subsystems self-report as invalid when an update or render is required. ents should avoid reading another ent's `invalid` state since it's cleared once that ent has been updated.

### Schema

there are two schemas: a game configuration (`void.json`) and level configs (`*.level.jsonc`). the parser assumes a valid schema to minimize code size.

levels are described with the level schema. some schema components may only be applied at parse time.

there's no runtime validation.

## Copyright and License

© oidoid.

### AGPL-3.0-only

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.

```
╭>°╮┬┌─╮╭─╮┬┌─╮
╰──╯┴└─╯╰─╯┴└─╯
```
