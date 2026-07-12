---
name: add-ent
description: add a new ent and hook to void or a void app.
---

# Add a New Ent

read the referenced example files before writing any code.

**1. create the ent data struct.** add a new struct named `<Name>Ent` to `src/void/ventities/<name>_ent.go` or `src/entities/<name>_ent.go` with props and embeds as needed with good default values. eg, [`src/demo/entities/superball_ent.go`](../../../src/demo/entities/superball_ent.go).

**2. add `Update()` method.** add an update method to the new struct. this is a hot loop. avoid pointers except `sprites *[]vgfx.Sprite`, `in *vinput.In`, `font *vtext.Font`, and large structs. do not add an interface to describe method args. the ent should test the clipbox before drawing itself. eg, [`src/demo/entities/mouse_status_ent.go`](../../../src/demo/entities/mouse_status_ent.go). the return value should avoid redraws (prefer `vgame.Pause`). add other methods as needed, especially for any interactions. eg, [`src/void/ventities/text_ent.go`](../../../src/void/ventities/text_ent.go).

**3. add the hook.** add a new hook to `src/void/vhooks/<name>_hooks.go` or `src/demo/hooks/<name>_hooks.go` with an update all function that loops over the ents and calls the ent's `Update<Names>()` method. eg, [`src/demo/hooks/mouse_status_hooks.go`](../../../src/demo/hooks/mouse_status_hooks.go).

**4. wire the ent instances and hook into the level.** add a new ent vector to the level init hook and register it with `gam.RegisterEntUpdate()`. eg, [`src/demo/levels/levelhooks/init_hooks.go`](../../../src/demo/levels/levelhooks/init_hooks.go).

# Tips

- `Sprite` is the drawing primitive most ents use. sprites should always specify a `Z`.
- `src/demo/` and [`src/demo/game/game_test.go`](../../../src/demo/game/game_test.go) are example dx and execution. `src/void/` is the generic engine.
- UI and forms are constructed with ents.
- ent update logic belongs in the ent's `Update()` method, not the update all hook.
