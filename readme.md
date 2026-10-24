# void

void is a 2D game and app engine for web browsers featuring:
- all game code in Go Wasm.
- fast loading.
- few dependencies.
- selective update for lo energy idle.
- compilation to a single standalone HTML file.
- text, nine-patch, and button primitives for basic UI.

## Development

all system packages start with "v" such as `vents` for "void ents".

see the [agent file](AGENTS.md).

### Project Layout

- `src/void/`: game engine.
- `src/void/vweb/`: web platform.
- `src/cmd/`: command line utils for building void apps.
- `src/internal/demo/`: engine demonstration.

### Architecture

```mermaid
---
config:
  look: classic
  htmlLabels: true
  flowchart:
    inheritDir: true
    padding: 5
    nodeSpacing: 14.5
    # offsets the 25 px Dagre adds inside groups.
    rankSpacing: -10.5
    subGraphTitleMargin: {top: 6, bottom: 30}
  themeVariables:
    lineColor: "#000000"
    textColor: "#000000"
    nodeTextColor: "#000000"
  themeCSS: |
    & { display: block; margin: 0; }
    .cluster-label { font-size: 18px; font-weight: bold; }
    .cluster-label p { padding: 0 12px; }
    .edgeLabel p { padding: 25.25px 0; background: none; }
    .labelBkg { background: none; }
---
flowchart TB
  subgraph demoTS["demo/web (TS)"]
    entryTS["<b>web</b><br/>entry"]:::demoCode
  end

  subgraph web["void/vweb (TS)"]
    webEng["<b>eng</b><br/>engine and IPC"]:::voidCode
    webIn["<b>in</b><br/>input"]:::voidCode
    webGfx["<b>gfx</b><br/>graphics"]:::voidCode
    webSfx["<b>sfx</b><br/>audio"]:::voidCode

    webBoards["<b>boards</b><br/>map config"]:::voidCode
    webGeo["<b>geo</b><br/>box types"]:::voidCode
    webUtils["<b>utils</b><br/>DOM utils"]:::voidCode
    webStorage["<b>storage</b><br/>file I/O"]:::voidCode

    webTypes["<b>types</b><br/>misc types"]:::voidCode

    %% invisible links arrange packages in four-column rows.
    webEng ~~~ webBoards
    webIn ~~~ webGeo
    webGfx ~~~ webUtils
    webSfx ~~~ webStorage
    webEng ~~~ webGeo
    webIn ~~~ webUtils
    webGfx ~~~ webStorage
    webBoards & webGeo & webUtils & webStorage ~~~ webTypes
  end

  subgraph demo["demo (Go)"]
    entryGo["<b>web</b><br/>Wasm exports"]:::demoCode
    game["<b>game</b><br/>ents, hooks, cam"]:::demoCode
    demoBoards["<b>boards</b><br/>map gencode"]:::demoCode
    demoAssets["<b>assets</b><br/>data"]:::demoCode
    demoTags["<b>tags</b><br/>sprite tags"]:::demoCode

    entryGo & game & demoBoards & demoAssets ~~~ demoTags
  end

  subgraph voidGo["void (Go)"]
    veng["<b>veng</b><br/>engine, ents, hooks"]:::voidCode
    vin["<b>vin</b><br/>input"]:::voidCode
    vgfx["<b>vgfx</b><br/>graphics"]:::voidCode
    vboards["<b>vboards</b><br/>maps"]:::voidCode

    vatlas["<b>vatlas</b><br/>spritesheet"]:::voidCode
    vtext["<b>vtext</b><br/>font and layout"]:::voidCode
    vgeo["<b>vgeo</b><br/>2d types and utils"]:::voidCode
    vgrid["<b>vgrid</b><br/>spatial grid"]:::voidCode

    vmath["<b>vmath</b><br/>math utils"]:::voidCode
    vvec["<b>vmem/vvec</b><br/>memory"]:::voidCode
    vrle["<b>vrle</b><br/>run-length encoding"]:::voidCode
    vtypes["<b>vtypes</b><br/>util types"]:::voidCode

    veng ~~~ vatlas ~~~ vmath
    vin ~~~ vtext ~~~ vvec
    vgfx ~~~ vgeo ~~~ vrle
    vboards ~~~ vgrid ~~~ vtypes
    veng ~~~ vtext
    vin ~~~ vgeo
    vgfx ~~~ vgrid
  end

  webAPIs["<b>web APIs</b><br/>DOM, WebGL, I/O, storage"]

  %% blank edge labels reserve spacing between areas.
  demoTS ==>|"&nbsp;"| web
  web ==>|"&nbsp;<br/><span style='background:#fff'>PollPtr, OutPtr, Update</span><br/>&nbsp;"| demo
  demo ==>|"&nbsp;"| voidGo
  web <==>|"&nbsp;"| webAPIs

  classDef area fill:#eeeeee,stroke:#eeeeee,color:#000000
  classDef demoCode fill:#dcfce7,stroke:#15803d,color:#000000
  classDef voidCode fill:#dbeafe,stroke:#1d4ed8,color:#000000
  class demoTS,web,demo,voidGo,webAPIs area
```

### Levels and Boards

levels are a higher-level app composition that selects a board and wires gameplay around it.

### Ents and Hooks

ents are a single data and behavior instance. hooks compose ents
with engine state and register as update functions.

ents with an update hook return whether they have been updated and so request a new frame. this is important for lo energy apps.

see the [agent skill](.agents/skills/add-ent/SKILL.md).

### Native Dependencies

- Aseprite
- cwebp
- Go
- Mono
- Node.js
- Shader Minifier
- TinyGo
- wasm-opt
- watchexec

### Make

debug make with `V=1 make --jobs=1`.

make debug builds with `DEBUG=1 make`.

### Testing

an example of a playwright test that takes a screenshot and verifies no console logs:

```ts
import {expect, test} from '@playwright/test'

const logs: string[] = []

test.beforeEach(async ({page}) => {
  logs.length = 0
  await page.addInitScript(() => {
    addEventListener('error', ev =>
      console.error(
        `[window.error] ${ev.error instanceof Error ? ev.error.message : ev.error}`
      )
    )
    addEventListener('unhandledrejection', ev =>
      console.error(
        `[window.unhandledrejection] ${ev.reason instanceof Error ? ev.reason.message : ev.reason}`
      )
    )
  })
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
})

test.afterEach(async ({page}) => {
  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  expect(logs, logs.join('\n')).toStrictEqual([])
})

test('test', async ({page}) => {
  await page.goto('http://localhost:1234/')
  await page.locator('canvas').click({position: {x: 123, y: 456}})
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page).toHaveScreenshot('load.png', {maxDiffPixelRatio: 0.01})
})

function onConsole(msg: {type(): string; text(): string}) {
  if (msg.type() === 'debug') return
  logs.push(`[console.${msg.type()}] ${msg.text()}`)
}

function onPageError(err: unknown) {
  logs.push(
    `[pageerror] ${String(err instanceof Error ? err.stack || err.message : err)}`
  )
}
```

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
