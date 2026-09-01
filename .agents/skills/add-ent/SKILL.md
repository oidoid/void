---
name: add-ent
description: add a new direct ent or batch hook to void or a void app.
---

# Add a New Ent

read the referenced example files before writing any code.

**1. create the ent data struct.** add a new struct named `<Name>Ent` to `src/void/ventities/<name>_ent.go` or `src/entities/<name>_ent.go` with props and embeds as needed with good default values. eg, [`src/demo/entities/superball_ent.go`](../../../src/demo/entities/superball_ent.go).

**2. add `Update()` method.** add an update method to the new struct. ents with < 100 instances implement `Update(gam Game)` with the game interface. if not, this is a hot loop so avoid pointers except `sprites *[]vgfx.Sprite`, `in *vinput.In`, `font *vtext.Font`, and large structs; do not add an interface to describe method args. the ent should test the clipbox before drawing itself. eg, [`src/demo/entities/mouse_status_ent.go`](../../../src/demo/entities/mouse_status_ent.go). the return value should avoid redraws (prefer `vgame.Pause`). add other methods as needed, especially for any interactions. eg, [`src/void/ventities/text_ent.go`](../../../src/void/ventities/text_ent.go). engine-wide state belongs in `vgame.Game`; do not use constructor references or runtime assertions.

**3. add the hook.** if >= 100 instances, add a new hook to `src/void/vhooks/<name>_hooks.go` or `src/demo/hooks/<name>_hooks.go` with an update all function that loops over the ents and calls the ent's `Update<Names>()` method. eg, [`src/demo/hooks/mouse_status_hooks.go`](../../../src/demo/hooks/mouse_status_hooks.go).

**4. wire the ent instances and hook into the level.** if >= 100 instances, add a new ent vector to the level init hook and register it with `gam.RegisterEntUpdate()`. eg, [`src/demo/levels/levelhooks/init_hooks.go`](../../../src/demo/levels/levelhooks/init_hooks.go). if not, call `gam.Register(&ent)` during level init.


# Tips

- `Sprite` is the drawing primitive most ents use. sprites should always specify a `Z`.
- `src/demo/` and [`src/demo/app/app_test.go`](../../../src/demo/app/app_test.go) are example dx and execution. `src/void/` is the generic engine.
- UI and forms are constructed with ents.
- ent update logic belongs in the ent's `Update()` method, not a hook.
- direct ents avoid an `EntVec` and hook below 100 instances.
- avoid inline closures for `EntVec` updates.
- hooks accept only their ent vector and `Game`.
- boards contain spatial data; levels select a board and compose gameplay around it.
