# Agent Instructions

## Before Starting Any Task

- check `.agents/skills/` for a relevant skill and follow it if one matches. never skip this step.
- read `readme.md` for project conventions, layout, and key concepts.

## Forbidden

never run:

- `make` (default target), `make watch`, or any daemon / forked / background process but you can ask the user to run.
- `make fat-save` or `make slow-save`. do not edit `.fat` or `.slow`.
- `make slow-check` or any performance test. these cannot run consistently without superuser permissions.
- never modify Git state in the current checkout unless explicitly requested. this includes changing the working tree, index, stash, branches, or references. eg, `git add`, `git rm`, `git stash`, `git restore`, `git reset`, `git checkout`, `git mv`, `git clean`, etc are all forbidden.

## `src/void` and `src/demo`

- minimize compile size. this is important.
- optimize execution performance.
- tune dx. keep it practical and idiomatic. consider usage patterns and lines of code cost at definition and call sites. suggest applying new patterns broadly.
- minimize heap de/allocations in game loop.
- prefer Go to TS.
- `src/void` packages start with "v", such as `ventities`. demo packages often mirror void structure but without the "v", such as `entities`.

### Pitfalls

- be deliberate when dereferencing in loops. they can be surprisingly slow. eg, an `Engine` pointer is convenient but slow in a hotloop.
- Go imports must be TinyGo compatible.
- never import `syscall/js`; pass state via Wasm exports and imports.
- use numeric millis not `time.Time` in Go. time comes from `Poll` via `Engine`; don't call `time.Now()`.
- http://localhost:1234 pauses when backgrounded.
- to force no kern, use `'\v'` between chars. to force a 1px kern, use `\t`.
- the Biome IDE extension is frequently corrupt.

## Style

- avoid single-letter names except `k` for key, `v` for value, `w`/`h` for width and height, `x`/`y`/`z` for coords, `r`/`w` for reader / writer, `r`/`l` for right/left.
- prefer tabular unit tests for cases varying only input and output pairings.
- prefer `err` for errors, never `e`.
- prefer `bin` for byte arrays never `bytes`.
- prefer `i` for loop indices but not items.
- use right terms for left:
  - Aseprite: ase
  - column(s): col, cols
  - configuration: config; never cfg
  - context: ctx
  - error: err
  - floating-point: float; never frac
  - for example: eg
  - format: fmt
  - high: hi
  - hit box: hitbox
  - hurt box: hurtbox
  - initialize: init
  - level: lvl
  - low: lo
  - memory: mem
  - millisecond(s): milli(s)
  - near box: nearbox
  - number: num
  - object(s): obj(s)
  - palette: pal
  - pointer lock: pointerlock
  - physical: phy
  - pixel(s): px(s)
  - property / properties: prop(s)
  - random: rnd
  - render box: clipbox
  - render: draw
  - rotation: rot
  - seconds: sec
  - source(s): src(s)
  - speed: vel
  - sprite: spr
  - string: str
  - template: templ
  - value(s): v, val(s)
  - velocity: vel
  - wake lock: wakelock
- sentences end with periods.
- capitalize but skip sentence capitalization.
- in English, prefer backticks around code snippets.
- represent bit fields with an unshifted mask and a shift.
- order dirs: E, NE, N, NW, W, SW, S, SE, Center.
- order public before private except for constructor which appears first.
- prefer one type per file.

### Go

- format: `make fmt-go fmt-mod`.
- prefer `vgeo.NewBox()` / `NewXY()` / `vgeo.NewWH()` to structs.
  use `vgeo.XYWH()` when working with w/h. for numeric literals, use a
  typed constructor and uncast values. eg, `vgeo.NewBox[float32](1, 2, 3, 4)`.
- omit inferrable type args.
- name the receiver `this`.
- when using a local for the subject of a constructor, name it `this`.
- name `In` vars `in`.
- assume tab width is two.
- wrap to 80 chars and pack cols to minimize lines. if all args / props can't fit on one line, do one arg / group per line. don't chop long strings.
- comments must not restate the subject name, must not start with "is the",
  and avoid starting with "the".
    ```go
    // ng: PadInt pads a non-negative integer to at least width digits with spaces.
    // ok: pads a non-negative integer to at least width digits with spaces.
    func PadInt(n, w int) string {
    ```
- remove excess parens.

### TS

- format: `make fmt-web`.

## Fractional Values

supporting both modern and pixel games is critical. be very sensitive to rounding errors.

- prefer flooring integral coords. avoid truncation that causes the range (-1, 1) to snap to 0.
- prefer ceiling integral sizes. avoid truncation that causes sizes to be unexpectedly short.
- prefer source data over inverted transforms to avoid accumulation errors.
- use `vgfx.DiagonalizeXY()` as needed to sync triggered movements.
- do not bother snapping sprites to integral boundaries. set `vengine.EngineOpts.RenderMode` to `vgfx.RenderModePixel` for pixel games. it snaps final sprite origins, disables antialiasing, and selects nearest rendering; retain fractional game coords for movement and collision. use `vgfx.RenderModeFloat` for smooth games.

## Verification

- typecheck Go: `go build ./...`.
- typecheck TS: `make typecheck-web`.
- test filesize: `make build && make fat-check`. the bottom line is `dist/demo/index.html` uncompressed size (first numerical column). if size drops 50+ KiB unexpectedly, ask the user if `make watch` is running. analyze filesize with `make fat-analyze`.
- `make build` and TinyGo take ~10s; run only when worthwhile. prefer `go build ./...` for typechecking.

## Development

- you can interact with the demo on http://localhost:1234 if the user is running `make`. try the URL or ask the user if you want to use it.
- test pointer collision with the cursor entity hitbox.
