---
name: add-ent
description: add a new direct ent or batch hook to void or a void app.
---

# Add a New Ent

read the referenced example files before writing any code.

**1. create the ent data struct.** add a new struct named `<Name>Ent` to `src/void/veng/<name>_ent.go` or `src/internal/demo/game/<name>_ent.go` with props and embeds as needed with good default values. eg, [`src/internal/demo/game/superball_ent.go`](../../../src/internal/demo/game/superball_ent.go).

**2. add `Update()` method.** add an update method to the new struct. ents with < 100 instances accept the concrete `*game.Game` and are registered directly using their bound `Update` method. do not introduce an interface to break a package dependency. if there are >= 100 instances, this is a hot loop so avoid pointers except `sprites *[]vgfx.Spr`, `in *vin.In`, `font *vtext.Font`, and large structs. the ent should test the clipbox before drawing itself. eg, [`src/internal/demo/game/mouse_status_ent.go`](../../../src/internal/demo/game/mouse_status_ent.go). the return value should avoid redraws (prefer `veng.Pause`). add other methods as needed, especially for any interactions. eg, [`src/void/veng/text_ent.go`](../../../src/void/veng/text_ent.go). engine-wide state belongs in `game.Game`; do not use constructor references or runtime assertions.

**3. add the batch hook.** if >= 100 instances, add an update-all function to the same `<name>_ent.go` file. it loops over the value slice and calls the ent's hot methods without per-ent pointer dereferences. eg, [`src/internal/demo/game/superball_ent.go`](../../../src/internal/demo/game/superball_ent.go). keep standalone `<name>_hooks.go` files only for hooks without an ent.

**4. wire the ent instances and hook into the game.** if >= 100 instances, create a new ent vector with `veng.NewEntVec()` and register its update method with `gam.RegisterUpdate()`. otherwise register the bound method directly, eg `gam.RegisterUpdate(ent.Update)`. see [`src/internal/demo/game/init.go`](../../../src/internal/demo/game/init.go).


# Tips

- `Sprite` is the drawing primitive most ents use. sprites should always specify a `Z`.
- `src/internal/demo/game` is the example composition and `src/void/veng` is the reusable runtime.
- UI and forms are constructed with ents.
- ent update logic belongs in the ent's `Update()` method, not a hook.
- direct ents avoid an `EntVec` and hook below 100 instances.
- avoid inline closures for `EntVec` updates.
- hooks accept only their ent vector and `Game`.
- boards contain spatial data; levels select a board and compose gameplay around it.
