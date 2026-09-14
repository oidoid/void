package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/vengine"
)

func UpdateMouseStatus(
	ent *entities.MouseStatusEnt,
	gam *engine.Eng,
) vengine.Status {
	return ent.Update(gam.Layer(gfx.LayerUI), gam.In(), gam.Ptrlock())
}
