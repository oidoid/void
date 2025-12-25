# void

basic 2D game library.

## Installation

```
npm install --save @oidoid/void
```

### Native Dependencies

- Aseprite
- cwebp

## Development

### Declaration Merging

to avoid threading template parameters throughout all code, declaration merging is used for the following:

- `CamSchema`
- `CamUpdater`
- `Debug`
- `Draw`
- `DrawSchema`
- `Ent`
- `EntSchema`
- `Loader`
- `PoolMap`
- `Sprite`
- `Sys`

it's similar to modifying `HTMLElementTagNameMap`.

### Queries

queries declare system dependencies.

sprite is a kind of common denominator for position and area. if the ent should have no visual representation, leave the sprite as hidden.

### ECS Order

ents are updated in insertion order. the cam and then cursor _ents_ should appear first.

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

systems are uniquely associated with a key. zero or one system per key. if multiple keys on an ent are associated with a system, it will be run multiple times per update.

### Schema

there are two schemas: a game configuration (`void.json`) and level configs (`*.level.jsonc`). the parser assumes a valid schema to minimize code size.

levels are described with the level schema. some schema components may only be applied at parse time.

### Invalid

ents and subsystems self-report as invalid when an update or render is required. ents should avoid reading another ent's `invalid` state since it's cleared once that ent has been updated.

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
