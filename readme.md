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

To avoid threading template parameters throughout all code, declaration merging is used for the following:

  - `Debug`
  - `Ent`
  - `EntSchema`
  - `PoolMap`
  - `Sprite`

It's similar to modifying `HTMLElementTagNameMap`.

### ECS Order

ents are updated in insertion order. the cursor _ent_ should appear first so that `Input.handled` is never true.

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

### Schema

some schema components may only be applied at parse time.

### Invalid

Ents and subsystems self-report as invalid when an update or render is required. Ents should avoid reading another ent's `invalid` state since it's cleared once that ent has been updated.

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
