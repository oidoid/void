package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/vengine"
)

func UpdateEntStatus(
	ent *entities.EntStatusEnt,
	gam *engine.Eng,
) vengine.Status {
	return ent.Update(
		gam.Font(), gam.Layer(ent.Z.Layer()), gam.SuperballCount(),
		len(gam.Layer(gfx.LayerSuperballs).Sprs),
	)
}
