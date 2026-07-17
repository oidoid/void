# Agent Instructions

if you change or add any pattern, or when you are corrected, update agent rules and skills as appropriate.

## Before Starting Any Task

- check `.agents/skills/` for a relevant skill and follow it if one matches. never skip this step.
- read `readme.md` for project conventions, layout, and key concepts.

## Forbidden

never run:

- `make` (default target) or `make watch` but you can ask the user to run.
- `make fat-save` or `make slow-save`. do not edit `.fat` or `.slow`.
- `make slow-check` or any performance test. these cannot run consistently without superuser permissions.
- never modify Git state in the current checkout unless explicitly requested. this includes changing the working tree, index, stash, branches, or references. eg, `git add`, `git rm`, `git stash`, `git restore`, `git reset`, `git checkout`, and `git clean` are all forbidden.

## `src/void` and `src/demo`

- minimize compile size. this is important.
- optimize execution performance.
- tune dx. keep it practical and idiomatic. consider usage patterns and lines of code cost at definition and call sites. suggest applying new patterns broadly.
- minimize heap allocations in game loop.
- prefer Go to TS.
- `src/void` packages start with "v", such as `ventities`. demo packages often mirror void structure but without the "v", such as `entities`.

### Pitfalls

- be deliberate when dereferencing in loops. they can be surprisingly slow.
- Go imports must be TinyGo compatible.
- never import `syscall/js`; pass state via Wasm exports and imports.
- http://localhost:1234 pauses when backgrounded.
- to force no kern, use `'\v'` between chars. to force a 1px kern, use `\t`.

## Style

- avoid single-letter names except `k` for key, `v` for value, `w`/`h` for width and height, `x`/`y`/`z` for coords.
- prefer tabular unit tests for cases varying only input and output pairings.
- prefer `err` for errors.
- prefer `i` for loop indices but not items.
- sentences end with periods.
- capitalize but skip sentence capitalization.
- in English, prefer backticks around code snippets.

### Go

- format: `make fmt-go fmt-mod`.
- name the receiver `this`.
- when using a local for the subject of a constructor, name it `this`.
- name `In` vars `in`.
- assume tab width is two.
- wrap to 80 chars and pack cols to minimize lines. if all args / props can't fit on one line, do one arg / group per line. don't chop long strings.
- comments must not restate the subject name.
    ```go
    // ng: PadInt pads a non-negative integer to at least width digits with spaces.
    // ok: pads a non-negative integer to at least width digits with spaces.
    func PadInt(n, w int) string {
    ```

### TS

- format: `make fmt-web`.

## Fractional Values

supporting both modern and pixel games is critical. be very sensitive to rounding errors.

- prefer flooring integral coords. avoid truncation that causes the range (-1, 1) to snap to 0.
- prefer ceiling integral sizes. avoid truncation that causes sizes to be unexpectedly short.
- prefer source data over inverted transforms to avoid accumulation errors.
- use `vgfx.DiagonalizeXY()` as needed to sync triggered movements.

## Verification

- typecheck Go: `go build ./...`
- typecheck TS: `make typecheck-web`
- test filesize: `make build && make fat-check`. the bottom line is `dist/demo/index.html` uncompressed size (first numerical column). `make build` takes ~10s; run only when worthwhile. if size drops 50+ KiB unexpectedly, ask the user if `make watch` is running. analyze filesize with `make fat-analyze`.

## Development

- you can interact with the demo on http://localhost:1234 if the user is running `make`. try the URL or ask the user if you want to use it.
